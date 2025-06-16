// scripts/update-html.js

const fs = require('fs');

function updateHTML() {
    try {
        console.log('🔄 Updating Weasels HTML file...');
        
        // Read menu data
        if (!fs.existsSync('menu-data.json')) {
            console.error('❌ menu-data.json not found!');
            process.exit(1);
        }
        
        const menuData = JSON.parse(fs.readFileSync('menu-data.json', 'utf8'));
        console.log('📋 Loaded menu data for:', Object.keys(menuData).join(', '));
        
        // Read current HTML
        if (!fs.existsSync('index.html')) {
            console.error('❌ index.html not found!');
            process.exit(1);
        }
        
        let html = fs.readFileSync('index.html', 'utf8');
        
        // Create properly formatted menu data string
        const menuDataString = JSON.stringify(menuData, null, 12);
        
        // Find and replace the getMenuData function
        const functionRegex = /function getMenuData\(\) \{[\s\S]*?return \{[\s\S]*?\};[\s\S]*?\}/;
        
        const newFunction = `function getMenuData() {
            // Auto-updated by GitHub Actions on ${new Date().toISOString().split('T')[0]}
            return ${menuDataString};
        }`;
        
        if (functionRegex.test(html)) {
            html = html.replace(functionRegex, newFunction);
            console.log('✅ Updated getMenuData function');
        } else {
            console.error('❌ Could not find getMenuData function in HTML');
            process.exit(1);
        }
        
        // Write updated HTML
        fs.writeFileSync('index.html', html);
        console.log('✅ Weasels HTML file updated successfully');
        
        // Log summary
        const totalDishes = Object.values(menuData).reduce((sum, dishes) => sum + dishes.length, 0);
        console.log(`📊 Updated with ${totalDishes} total dishes across ${Object.keys(menuData).length} days`);
        
    } catch (error) {
        console.error('❌ Error updating Weasels HTML:', error.message);
        process.exit(1);
    }
}

updateHTML();
