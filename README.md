# Vintage Slav Code Repository  
This repository hosts external JavaScript and CSS modules for the Vintage Slav website. The files are organized into separate folders for maintainability and clarity.  

## Structure  
- **css/custom.css** – global styling overrides.  
- **css/filters.css** – styles extracted from the shop filter overlay.  
- **scripts/config.js** – feature toggles controlling which modules load (filters, loader, logo spin, debug).  
- **scripts/main.js** – main entry point that conditionally imports modules based on the configuration.  
- **scripts/filters.js** – JavaScript logic for the shop filter overlay.  
- **scripts/loader.js** – logic for the loading screen.  
- **scripts/logoSpin.js** – vinyl‑record style spinning logo animation.  

## Using these files in Squarespace  
Add the following lines to your Squarespace **Code Injection** (Header) section to load the CSS and JavaScript from this repository:  

```html  
<link rel="stylesheet" href="https://raw.githubusercontent.com/vladithedaddy/vintageslav-code/main/css/custom.css">  
<link rel="stylesheet" href="https://raw.githubusercontent.com/vladithedaddy/vintageslav-code/main/css/filters.css">  
<script type="module" src="https://raw.githubusercontent.com/vladithedaddy/vintageslav-code/main/scripts/main.js"></script>  
```  

This setup loads the main entry script and the CSS files via raw GitHub URLs. To enable or disable features (such as the filter overlay, loader, or logo spin), edit the boolean values in **scripts/config.js**.  

## Development workflow  
1. Clone or download this repository to your local machine.  
2. Use VS Code with the ChatGPT/Codex extension to edit the files. Codex can assist with refactoring and creating new modules.  
3. Commit and push your changes to the `main` branch.  
4. Squarespace will automatically load the updated files via the raw GitHub URLs. 
