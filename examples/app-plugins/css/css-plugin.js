/**
* (See the plugin-sdk's README.md for more details on how to install and test these examples.)
* 
* Example plugin which demonstrates how to add custom CSS to a page.
*
* Try it out by installing the plugin (see README.md).
* 
* It demonstrates:
* - Adding custom CSS to a page using the ui.injectCSS() method
* - Including a .css file within the plugin
*/

import css  from './styles.css';

export class Plugin extends AppPlugin {
	onLoad() {
		this.ui.injectCSS(css);
	}
}

