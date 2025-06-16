const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const MENU_URL = 'https://www.uni-bremen.de/universitaet/campus/essen/speiseplaene/cafeteria/392';

async function scrapeMenu() {
    try {
        console.log('🔍 Scraping menu data...');
        
        const response = await axios.get(MENU_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MenuBot/1.0)'
            }
        });
        
        const $ = cheerio.load(response.data);
        const menuData = {};
        
        // Parse the table structure
        $('table tr').each((index, element) => {
            const day = $(element).find('td:first-child').text().trim();
            const dishes = $(element).find('td:last-child').text().trim();
            
            if (day && dishes && day !== 'Wochentag') {
                menuData[translateDay(day)] = parseDishesByPrices(dishes);
            }
        });
        
        // Save to JSON file
        fs.writeFileSync('menu-data.json', JSON.stringify(menuData, null, 2));
        console.log('✅ Menu data saved successfully');
        
        return menuData;
        
    } catch (error) {
        console.error('❌ Error scraping menu:', error.message);
        process.exit(1);
    }
}

function translateDay(germanDay) {
    const dayMap = {
        'Montag': 'Monday',
        'Dienstag': 'Tuesday', 
        'Mittwoch': 'Wednesday',
        'Donnerstag': 'Thursday',
        'Freitag': 'Friday'
    };
    return dayMap[germanDay] || germanDay;
}

function parseDishesByPrices(dishesText) {
    const dishes = [];
    
    // Regex to find prices (e.g., "9,90 €", "4,50 €")
    const priceRegex = /(\\d+,\\d+)\\s*€([^\\d€]+?)(?=\\d+,\\d+\\s*€|$)/g;
    
    let match;
    while ((match = priceRegex.exec(dishesText)) !== null) {
        const price = match[1].replace(',', '.');
        const dishName = match[2].trim();
        
        if (dishName && price) {
            dishes.push({
                name: dishName,
                price: price
            });
        }
    }
    
    return dishes;
}

scrapeMenu();
