import earthTexture from './earth_atmos_4096.avif'; // lower-res than original earth_atmos_4096.jpg

export class InteractiveGlobe {
	/**
	 * 
	 * @param {HTMLElement} container  
	 * @param {function(string):void} onOpen 
	 * @param {*} THREE
	 * @param {string} countryGeojsonUrl
	 */
	constructor(container, onOpen, THREE, countryGeojsonUrl) {
		this.onOpen = onOpen;
		this.container = container;
		this.THREE = THREE;
		this.scene = new this.THREE.Scene();
		this.camera = new this.THREE.PerspectiveCamera(120, this.container.clientWidth / this.container.clientHeight, 0.1, 2000);
		this.renderer = new this.THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.raycaster = new this.THREE.Raycaster();
		this.mouse = new this.THREE.Vector2();
		this.countries = new Map();
		this.highlightedCountries = new Set();
		this.radius = 200;
		this.geojsonData = null;
		this.hoveredCountry = null;
		this.time = 0;
		this.isDragging = false;
		this.lastDragTime = 0;
		this.hoverLabel = document.getElementById('hover-label');
		this.countryGeojsonUrl = countryGeojsonUrl;
		this.init();
	}

	init() {
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
		this.container.appendChild(this.renderer.domElement);

		this.camera.position.z = 300;
		this.controls = new this.THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enablePan = false;
		this.controls.addEventListener('change', () => {
			this.isDragging = true;
			this.lastDragTime = Date.now();
		});
		this.controls.addEventListener('end', () => {
			this.isDragging = false;
			this.lastDragTime = Date.now();
		});

		this.createBackground();
		this.createGlobe();
		this.createAtmosphere();
		this.createGrid();
		//this.createParticles();
		this.createLensFlare();
		
		const ambientLight = new this.THREE.AmbientLight(0x4040ff, 0.5);
		this.scene.add(ambientLight);
		const directionalLight = new this.THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 3, 5);
		this.scene.add(directionalLight);

		window.addEventListener('resize', () => this.onWindowResize());
		this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
		this.container.addEventListener('mousedown', (e) => {
			this.clickX = e.clientX;
			this.clickY = e.clientY;                    
		});
		this.container.addEventListener('mouseup', (e) => {
			if (this.clickX != e.clientX || this.clickY != e.clientY) {
				// move while clicking
				return;
			}
			this.onMouseClick(e);
		});

		this.loadCountries();
	}

	createBackground() {
		const starsGeometry = new this.THREE.BufferGeometry();
		const starCount = 1000;
		const positions = new Float32Array(starCount * 3);
		const minDistance = this.radius * 2;

		for (let i = 0; i < starCount; i++) {
			let x, y, z, distance;
			do {
				x = (Math.random() - 0.5) * 2000;
				y = (Math.random() - 0.5) * 2000;
				z = (Math.random() - 0.5) * 2000;
				distance = Math.sqrt(x * x + y * y + z * z);
			} while (distance < minDistance);

			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;
		}

		starsGeometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
		const starsMaterial = new this.THREE.PointsMaterial({
			color: 0xffffff,
			size: 1.5,
			transparent: true,
			opacity: 0.7
		});
		const starField = new this.THREE.Points(starsGeometry, starsMaterial);
		this.scene.add(starField);
	}

	createGlobe() {
		const geometry = new this.THREE.SphereGeometry(this.radius, 64, 64);
		const textureLoader = new this.THREE.TextureLoader();
		const texture = textureLoader.load(earthTexture);
		
		const material = new this.THREE.MeshPhongMaterial({
			map: texture,
			specular: 0x222222,
			shininess: 10,
			transparent: true,
			opacity: 0.95
		});
		this.globe = new this.THREE.Mesh(geometry, material);
		this.scene.add(this.globe);
	}

	createAtmosphere() {
		const atmosphereGeometry = new this.THREE.SphereGeometry(this.radius * 1.03, 64, 64);
		const atmosphereMaterial = new this.THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				innerColor: { value: new this.THREE.Color(0x00ccff) },
				outerColor: { value: new this.THREE.Color(0x0066ff) },
				auroraColor: { value: new this.THREE.Color(0x00ff99) }
			},
			vertexShader: `
				varying vec3 vNormal;
				varying vec3 vPosition;
				void main() {
					vNormal = normalize(normalMatrix * normal);
					vPosition = position;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: `
				uniform float time;
				uniform vec3 innerColor;
				uniform vec3 outerColor;
				uniform vec3 auroraColor;
				varying vec3 vNormal;
				varying vec3 vPosition;
				void main() {
					float baseIntensity = pow(1.0 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
					float dist = length(vPosition) / ${this.radius * 1.03}.0;
					vec3 baseColor = mix(innerColor, outerColor, dist);
					float pulse = 0.9 + 0.3 * sin(time * 0.5); // Slower base pulse

					float aurora = abs(vPosition.y / ${this.radius * 1.03}.0);
					float auroraIntensity = smoothstep(0.6, 1.0, aurora) * (0.7 + 0.3 * sin(time * 0.3 + vPosition.x * 0.02)); // Much slower aurora
					vec3 color = mix(baseColor, auroraColor, auroraIntensity * 0.8);

					float finalIntensity = max(baseIntensity, auroraIntensity) * pulse;
					gl_FragColor = vec4(color, finalIntensity) * 1.5; // Increased vibrancy
				}
			`,
			side: this.THREE.BackSide,
			blending: this.THREE.AdditiveBlending,
			transparent: true,
			depthWrite: false
		});
		this.atmosphere = new this.THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
		this.scene.add(this.atmosphere);
	}

	createGrid() {
		const gridGeometry = new this.THREE.SphereGeometry(this.radius * 1.005, 32, 32);
		const gridMaterial = new this.THREE.MeshBasicMaterial({
			color: 0x00ffcc,
			wireframe: true,
			transparent: true,
			opacity: 0.02,
		});
		this.grid = new this.THREE.Mesh(gridGeometry, gridMaterial);
		//this.scene.add(this.grid);
	}

	createParticles() {
		const particleCount = 200;
		const particlesGeometry = new this.THREE.BufferGeometry();
		const positions = new Float32Array(particleCount * 3);
		const velocities = new Float32Array(particleCount * 3);

		for (let i = 0; i < particleCount; i++) {
			const theta = Math.random() * 2 * Math.PI;
			const phi = Math.acos(2 * Math.random() - 1);
			const r = this.radius * 1.1 + Math.random() * 20;
			
			positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
			positions[i * 3 + 1] = r * Math.cos(phi);
			positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

			velocities[i * 3] = (Math.random() - 0.5) * 0.05;
			velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
			velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
		}

		particlesGeometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
		const particlesMaterial = new this.THREE.PointsMaterial({
			color: 0x00ffff,
			size: 2,
			transparent: true,
			opacity: 0.8,
			blending: this.THREE.AdditiveBlending
		});
		this.particles = new this.THREE.Points(particlesGeometry, particlesMaterial);
		this.particles.userData.velocities = velocities;
		//this.scene.add(this.particles);
	}

	createLensFlare() {
		const flareGeometry = new this.THREE.PlaneGeometry(2000, 2000);
		const flareMaterial = new this.THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				cameraPosition: { value: new this.THREE.Vector3() },
				lightPosition: { value: new this.THREE.Vector3(5, 3, 5) }
			},
			vertexShader: `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: `
				uniform float time;
				uniform vec3 lightPosition;
				varying vec2 vUv;
				void main() {
					vec2 uv = vUv - 0.5;
					float dist = length(uv);
					float angle = dot(normalize(cameraPosition), normalize(lightPosition));
					float flare = pow(max(0.0, angle), 10.0) * (0.5 + 0.5 * sin(time * 2.0));
					float intensity = smoothstep(0.1, 0.0, dist) * flare * 0.3;
					gl_FragColor = vec4(0.0, 0.8, 1.0, intensity); // Cyan flare
				}
			`,
			transparent: true,
			blending: this.THREE.AdditiveBlending,
			depthTest: false
		});
		this.lensFlare = new this.THREE.Mesh(flareGeometry, flareMaterial);
		this.lensFlare.position.z = -1000; // Far behind globe
		//this.scene.add(this.lensFlare);
	}

	loadCountries() {
		fetch(this.countryGeojsonUrl)
			.then(response => response.json())
			.then(data => {
				this.geojsonData = data;
				this.createCountries(data);
				// Use pending country list if it exists, otherwise use default list
				const countriesToHighlight = this.pendingCountryList || []; //['Netherlands'];
				return this.highlightCountries(countriesToHighlight);
			})
			.then(() => this.animate())
			.catch(error => console.error('Error loading GeoJSON:', error));
	}

	/**
	 * @param {{ features: any[]; }} geojson
	 */
	createCountries(geojson) {
		const baseMaterial = new this.THREE.MeshBasicMaterial({
			color: 0x666666,
			transparent: true,
			opacity: 0.1,
			side: this.THREE.DoubleSide,
			//blending: THREE.AdditiveBlending
		});

		const glowMaterial = new this.THREE.MeshBasicMaterial({
			color: 0x00ffff,
			transparent: true,
			opacity: 0.7,
			blending: this.THREE.AdditiveBlending,
			side: this.THREE.DoubleSide
		});

		geojson.features.forEach(feature => {
			const countryName = feature.properties.ADMIN || feature.properties.NAME;
			const countryGroup = new this.THREE.Group();
			const meshes = this.geoJsonToSurfaceMeshes(feature.geometry, baseMaterial, glowMaterial);
			
			meshes.base.forEach(mesh => countryGroup.add(mesh));
			meshes.glow.forEach(mesh => countryGroup.add(mesh));

			this.countries.set(countryName, countryGroup);
			this.scene.add(countryGroup);
		});
	}

	/**
	 * @param {{ type: string; coordinates: any; }} geometry
	 * @param {{ clone: () => any; }} baseMaterial
	 * @param {{ clone: () => any; }} glowMaterial
	 */
	geoJsonToSurfaceMeshes(geometry, baseMaterial, glowMaterial) {
		/**
		 * @type {any[]}
		 */
		const baseMeshes = [];
		/**
		 * @type {any[]}
		 */
		const glowMeshes = [];
		const coords = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];

		coords.forEach((/** @type {any[]} */ polygon) => {
			/**
			 * @type {any[]}
			 */
			const points = [];
			const indices = [];

			// @ts-ignore
			polygon[0].forEach(([lon, lat]) => {
				points.push(this.latLonToVector3(lat, lon));
			});

			for (let i = 1; i < points.length - 1; i++) {
				indices.push(0, i, i + 1);
			}

			const geometry = new this.THREE.BufferGeometry();
			const vertices = new Float32Array(points.length * 3);
			points.forEach((point, i) => {
				vertices[i * 3] = point.x;
				vertices[i * 3 + 1] = point.y;
				vertices[i * 3 + 2] = point.z;
			});

			geometry.setAttribute('position', new this.THREE.BufferAttribute(vertices, 3));
			geometry.setIndex(indices);
			geometry.computeVertexNormals();

			const baseMesh = new this.THREE.Mesh(geometry, baseMaterial.clone());
			const glowMesh = new this.THREE.Mesh(geometry.clone(), glowMaterial.clone());
			glowMesh.scale.set(1.005, 1.005, 1.005);

			baseMeshes.push(baseMesh);
			glowMeshes.push(glowMesh);
		});

		return { base: baseMeshes, glow: glowMeshes };
	}

	/**
	 * @param {number} lat
	 * @param {number} lon
	 */
	latLonToVector3(lat, lon) {
		const phi = (90 - lat) * Math.PI / 180;
		const theta = (lon + 180) * Math.PI / 180;
		const radius = this.radius + 0.1;

		return new this.THREE.Vector3(
			-radius * Math.sin(phi) * Math.cos(theta),
			radius * Math.cos(phi),
			radius * Math.sin(phi) * Math.sin(theta)
		);
	}

	/**
	 * @param {string[]} countryList
	 */
	async highlightCountries(countryList) {
		this.highlightedCountries = new Set(countryList);
		
		for (const [countryName, group] of this.countries) {
			const isHighlighted = this.highlightedCountries.has(countryName);
			// @ts-ignore
			group.children.forEach(mesh => {
				if (mesh.material.blending === this.THREE.AdditiveBlending) {
					mesh.visible = isHighlighted;
					mesh.userData.isGlow = true;
				} else {
					mesh.material.opacity = isHighlighted ? 0.6 : 0.0;
				}
			});
		}
	}

	/**
	 * Updates the list of highlighted countries on the globe
	 * @param {string[]} countryList - Array of country names to highlight
	 */
	showCountries(countryList) {
		if (!this.countries || this.countries.size === 0) {
			console.warn('Globe not yet initialized, countries will be highlighted after initialization');
			// Store the list to be used after initialization
			this.pendingCountryList = countryList;
			return;
		}
		this.highlightCountries(countryList);
	}

	/**
	 * @param {MouseEvent} event
	 */
	onMouseMove(event) {
		const rect = this.container.getBoundingClientRect();
		this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);
		const intersects = this.raycaster.intersectObjects([...this.countries.values()].flatMap(g => g.children.filter((/** @type {{ material: { blending: any; }; }} */ m) => m.material.blending !== this.THREE.AdditiveBlending)));
		/** @type {any[]} */

		if (this.hoveredCountry) {
			this.hoveredCountry.children.forEach((/** @type {{ userData: { isGlow: any; }; material: { opacity: number; }; }} */ mesh) => {
				if (mesh.userData.isGlow) {
					mesh.material.opacity = 0.1;
				} else {
					mesh.material.opacity = this.highlightedCountries.has(this.hoveredCountry.name) ? 0.1 : 0.0;
				}
			});
			if (this.hoverLabel) {
				this.hoverLabel.style.display = 'none';
			}
			this.container.style.cursor = 'default';
			this.hoveredCountry = null;
		}

		if (intersects.length > 0) {
			const countryGroup = intersects[0].object.parent;
			const countryName = [...this.countries.entries()]
				.find(([_, group]) => group === countryGroup)?.[0];
			
			if (this.highlightedCountries.has(countryName)) {
				this.hoveredCountry = countryGroup;
				this.hoveredCountry.name = countryName;
				
				countryGroup.children.forEach((/** @type {{ userData: { isGlow: any; }; material: { opacity: number; }; }} */ mesh) => {
					if (mesh.userData.isGlow) {
						mesh.material.opacity = 0.9;
					} else {
						mesh.material.opacity = 0.8;
					}
				});

				if (this.hoverLabel) {
					this.hoverLabel.textContent = countryName;
					
					// Fix for hover label positioning - use fixed positioning
					this.hoverLabel.style.position = 'fixed';
					this.hoverLabel.style.left = `${event.clientX + 10}px`;
					this.hoverLabel.style.top = `${event.clientY - 30}px`;
					this.hoverLabel.style.display = 'block';
				}
				
				this.container.style.cursor = 'pointer';
			}
		}
	}

	/**
	 * @param {MouseEvent} _event
	 */
	onMouseClick(_event) {
		this.raycaster.setFromCamera(this.mouse, this.camera);
		const intersects = this.raycaster.intersectObjects([...this.countries.values()].flatMap(g => g.children.filter((/** @type {{ material: { blending: any; }; }} */ m) => m.material.blending !== this.THREE.AdditiveBlending)));
		if (intersects.length > 0) {
			const countryGroup = intersects[0].object.parent;
			const countryName = [...this.countries.entries()]
				.find(([_, group]) => group === countryGroup)?.[0];
			
			if (countryName) {
				this.onOpen(countryName);
			}
		}
	}

	onWindowResize() {
		this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
	}

	animate() {
		requestAnimationFrame(() => this.animate());
		this.time += 0.03;

		this.countries.forEach((group, countryName) => {
			if (this.highlightedCountries.has(countryName) && group !== this.hoveredCountry) {
				group.children.forEach((/** @type {{ userData: { isGlow: any; }; material: { opacity: number; }; }} */ mesh) => {
					if (mesh.userData.isGlow) {
						const pulse = 0.7 + Math.sin(this.time) * 0.1;
						mesh.material.opacity = pulse;
					}
				});
			}
		});

		if (this.atmosphere) {
			this.atmosphere.material.uniforms.time.value = this.time;
		}
		if (this.grid) {
			this.grid.rotation.y += 0.001;
		}
		if (this.particles) {
			const positions = this.particles.geometry.attributes.position.array;
			const velocities = this.particles.userData.velocities;
			for (let i = 0; i < positions.length / 3; i++) {
				positions[i * 3] += velocities[i * 3];
				positions[i * 3 + 1] += velocities[i * 3 + 1];
				positions[i * 3 + 2] += velocities[i * 3 + 2];

				const dist = Math.sqrt(
					positions[i * 3] * positions[i * 3] +
					positions[i * 3 + 1] * positions[i * 3 + 1] +
					positions[i * 3 + 2] * positions[i * 3 + 2]
				);
				if (dist > this.radius * 1.5 || dist < this.radius * 1.05) {
					velocities[i * 3] *= -1;
					velocities[i * 3 + 1] *= -1;
					velocities[i * 3 + 2] *= -1;
				}
			}
			this.particles.geometry.attributes.position.needsUpdate = true;
		}
		if (this.lensFlare) {
			this.lensFlare.material.uniforms.time.value = this.time;
			this.lensFlare.material.uniforms.cameraPosition.value.copy(this.camera.position);
		}

		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	}
}

