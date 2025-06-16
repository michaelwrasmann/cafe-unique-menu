const fs = require('fs');

function updateHTML() {
    try {
        console.log('🔄 Updating HTML file...');
        
        // Read menu data
        const menuData = JSON.parse(fs.readFileSync('menu-data.json', 'utf8'));
        
        // Read current HTML
        let html = fs.readFileSync('index.html', 'utf8');
        
        // Find and replace the menu data in JavaScript
        const menuDataString = JSON.stringify(menuData, null, 12);
        
        html = html.replace(
            /function getMenuData\\(\\) \\{[\\s\\S]*?return \\{[\\s\\S]*?\\};[\\s\\S]*?\\}/,
            `function getMenuData() {
            // Auto-updated by GitHub Actions on ${new Date().toISOString().split('T')[0]}
            return ${menuDataString};
        }`
        );
        
        // Write updated HTML
        fs.writeFileSync('index.html', html);
        console.log('✅ HTML file updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating HTML:', error.message);
        process.exit(1);
    }
}

updateHTML();
