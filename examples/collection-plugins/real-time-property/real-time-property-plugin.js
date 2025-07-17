/**
 * (See the plugin-sdk's README.md for more details on how to install and test these examples.)
 * 
 * Example plugin that demonstrates custom rendering of a property with "real-time" data. We override the rendering
 * of a property value by using the .render() hook. We then return a custom HTML element, which renders itself by
 * fetching data from a source. In this example the source is a simple random number generator to create a fun
 * visual effect of a live CPU/resource bar, but it could be any (remote) source.
 * 
 * Features:
 * - Custom rendering a property
 * - Using a Custom HTML element to render a property
 * - Async render values
 * 
 * Try it out by installing the plugin (see README.md), and then creating a few resources in the collection 
 * (just create a few records with a few titles).
 * 
 * Most of the (AI-generated) code below is just to make the demo values look nice and isn't really needed for the 
 * custom rendering itself.
 */

class LiveCpuBar extends HTMLElement {
	connectedCallback() {
		this.render();
		const baseInterval = 300;
		const jitter = Math.random() * 400 - 200; // -200 to +200ms
		const interval = baseInterval + jitter;
		this._interval = setInterval(() => this.updateUsage(), interval);
		
		// Initialize with a random starting value, slightly favoring higher values
		this._currentValue = Math.floor(Math.random() * 80) + 10; // 10-90 range
	}
  
	disconnectedCallback() {
		clearInterval(this._interval);
	}
  
	async updateUsage() {
		let usage = await this.simulateCpu(); // or fetch from a source

		if (isNaN(usage)) {
			usage = 0;
		}

		this.renderBar(usage);
	}
  
	/**
	 * @param {number} value
	 */
	renderBar(value) {
		const percentage = Math.min(100, Math.max(0, value));
		const blocks = this.getAsciiBlocks(percentage);
		
		this.innerHTML = `
			<div class="cpu-bar-container">
				<div class="cpu-bar-fill" style="width: ${percentage}%;">
					${blocks}
				</div>
				<div class="cpu-bar-text">${Math.round(value)}%</div>
			</div>
		`;
	}
  
	/**
	 * @param {number} percentage
	 */
	getAsciiBlocks(percentage) {
		const totalBlocks = 20;
		const filledBlocks = Math.floor((percentage / 100) * totalBlocks);
		const partialBlock = (percentage / 100) * totalBlocks - filledBlocks;
		
		let blocks = '';
		
		// Add filled blocks with position-based colors
		for (let i = 0; i < filledBlocks; i++) {
			const position = (i / totalBlocks) * 100; // 0-100%
			const color = this.getBlockColor(position);
			blocks += `<span class="ascii-block filled" style="color: ${color};">▓</span>`;
		}
		
		// Add partial block if needed
		if (partialBlock > 0 && filledBlocks < totalBlocks) {
			let partialChar = '░';
			if (partialBlock > 0.33) partialChar = '▒';
			if (partialBlock > 0.66) partialChar = '▓';
			const position = (filledBlocks / totalBlocks) * 100;
			const color = this.getBlockColor(position);
			blocks += `<span class="ascii-block partial" style="color: ${color};">${partialChar}</span>`;
		}
		
		// Add empty blocks
		const emptyBlocks = totalBlocks - filledBlocks - (partialBlock > 0 ? 1 : 0);
		for (let i = 0; i < emptyBlocks; i++) {
			blocks += '<span class="ascii-block empty">░</span>';
		}
		
		return blocks;
	}
  
	async simulateCpu() {
		// Simulate a delay to make it look like we're fetching data from a source. We could do a network request
		// here for example.
		await new Promise(resolve => setTimeout(resolve, 100)); 
		
		// Occasionally make a big jump (10% chance)
		if (Math.random() < 0.1) {
			// Big jump: slightly favor positive changes
			const bigChange = (Math.random() - 0.45) * 30 + (Math.random() > 0.45 ? 15 : -15);
			this._currentValue += bigChange;
		} else {
			// Normal gradual change with very slight upward bias
			const changeRange = 20; // Maximum change per update
			const change = (Math.random() - 0.48) * changeRange; // -3.84 to +4.16 (very slight bias)
			this._currentValue += change;
		}
		
		// Keep within bounds
		this._currentValue = Math.max(0, Math.min(100, this._currentValue));
		
		return this._currentValue;
	}
  
	/**
	 * @param {number} position
	 */
	getBlockColor(position) {
		if (position >= 80) return 'var(--color-fuchsia-700, var(--enum-fuchsia-bg))'; // Violet
		if (position >= 60) return 'var(--color-red-700, var(--enum-red-bg))'; // Red
		if (position >= 40) return 'var(--color-orange-700, var(--enum-orange-bg))'; // Orange
		if (position >= 20) return 'var(--color-yellow-700, var(--enum-yellow-bg))'; // Yellow
		if (position >= 0) return 'var(--color-lime-700, var(--enum-green-bg))'; // Green
		return 'var(--color-blue-700, var(--enum-blue-bg))'; // Blue (fallback)
	}
  
	render() {
		this.updateUsage();
	}
}

export class Plugin extends CollectionPlugin {

	onLoad() {

		if (!customElements.get('live-cpu-bar')) {
			customElements.define('live-cpu-bar', LiveCpuBar);
		}

		this.ui.injectCSS(`
			live-cpu-bar {
				display: inline-block;
				width: 160px;
				height: 20px;
				position: relative;
				border-radius: 4px;
				overflow: hidden;
				font-family: 'Courier New', monospace;
				font-size: 12px;
				line-height: 1;
			}
			
			live-cpu-bar .cpu-bar-container {
				position: relative;
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
			}
			
			live-cpu-bar .cpu-bar-fill {
				height: 100%;
				transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
				position: relative;
				display: flex;
				align-items: center;
				overflow: hidden;
				background: transparent;
			}
			
			live-cpu-bar .ascii-block {
				display: inline-block;
				transition: all 0.3s ease;
				flex-shrink: 0;
				margin-right: 1px;
			}
						
			live-cpu-bar .ascii-block.partial {
				color: rgba(255, 255, 255, 0.7);
			}
			
			live-cpu-bar .ascii-block.empty {
				color: #444;
			}
			
			live-cpu-bar .cpu-bar-text {
				position: absolute;
				top: 50%;
				left: 10%;
				transform: translate(-50%, -50%);
				font-weight: bold;
				color: var(--text-subtle);
				z-index: 2;
				pointer-events: none;
				font-family: 'Courier New', monospace;
				padding: 1px 4px;
				border-radius: 2px;
			}
			
		`);

		// Custom rendering for Utilization as a color-coded data bar
		this.properties.render("Utilization", ({record, prop, view}) => {

			let val = prop.number() || 1;

			const el = document.createElement("live-cpu-bar");
			el.setAttribute("initial", val.toString()); // optional
			return el;
		});

	}

}
