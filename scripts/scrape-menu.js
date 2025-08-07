// scripts/scrape-menu.js

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const MENU_URL = 'https://www.uni-bremen.de/universitaet/campus/essen/speiseplaene/cafeteria/392';

async function scrapeMenu() {
    try {
        console.log('🔍 Scraping Weasels menu data...');
        
        const response = await axios.get(MENU_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WeaselsMenuBot/1.0)'
            }
        });
        
        const $ = cheerio.load(response.data);
        const menuData = {};
        
        // Parse the table structure from Uni Bremen
        $('table tr').each((index, element) => {
            const dayCell = $(element).find('td:first-child').text().trim();
            const dishesCell = $(element).find('td:last-child').text().trim();
            
            if (dayCell && dishesCell && dayCell !== 'Wochentag') {
                const englishDay = translateDay(dayCell);
                if (englishDay) {
                    menuData[englishDay] = parseDishesByPrices(dishesCell);
                }
            }
        });
        
        // Save to JSON file
        fs.writeFileSync('menu-data.json', JSON.stringify(menuData, null, 2));
        console.log('✅ Weasels menu data saved successfully');
        console.log('📋 Found menus for:', Object.keys(menuData).join(', '));
        
        return menuData;
        
    } catch (error) {
        console.error('❌ Error scraping Weasels menu:', error.message);
        
        // Fallback: Keep existing menu if scraping fails
        if (fs.existsSync('menu-data.json')) {
            console.log('📋 Using existing menu data as fallback');
            return JSON.parse(fs.readFileSync('menu-data.json', 'utf8'));
        }
        
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
    return dayMap[germanDay] || null;
}

function parseDishesByPrices(dishesText) {
    const dishes = [];
    
    // Clean up the text
    let cleanText = dishesText
        .replace(/\s+/g, ' ')
        .replace(/€/g, ' €')
        .trim();
    
    // Regex to find prices and associated dishes
    // Look for patterns like "9,90 €" or "4,50 €"
    const priceRegex = /([\d,]+)\s*€\s*([^€]*?)(?=[\d,]+\s*€|$)/g;
    
    let match;
    while ((match = priceRegex.exec(cleanText)) !== null) {
        const price = match[1].replace(',', '.');
        let dishName = match[2].trim();
        
        // Clean up dish name - remove trailing numbers that might be leftover prices
        dishName = dishName
            .replace(/^\s*[\/\-\|]\s*/, '') // Remove leading separators
            .replace(/\s*[\/\-\|]\s*$/, '') // Remove trailing separators
            .replace(/\d+[,\.]\d+$/, '') // Remove trailing price patterns like "4,50" or "4.50"
            .replace(/\d+$/, '') // Remove trailing numbers
            .replace(/\s+/g, ' ')
            .trim();
        
        if (dishName && price && dishName.length > 3) {
            dishes.push({
                name: dishName,
                price: price // Euro sign will be added in HTML rendering
            });
        }
    }
    
    // If regex parsing failed, try simple splitting
    if (dishes.length === 0) {
        console.log('🔄 Trying alternative parsing method...');
        const parts = cleanText.split('€');
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i].trim();
            const priceMatch = part.match(/([\d,]+)$/);
            
            if (priceMatch) {
                const price = priceMatch[1].replace(',', '.');
                let dishName = part.replace(priceMatch[0], '').trim();
                
                // Additional cleanup for dish names
                dishName = dishName
                    .replace(/\d+[,\.]\d+$/, '') // Remove trailing price patterns
                    .replace(/\d+$/, '') // Remove trailing numbers
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (dishName && dishName.length > 3) {
                    dishes.push({
                        name: dishName,
                        price: price
                    });
                }
            }
        }
    }
    
    console.log(`📝 Parsed ${dishes.length} dishes`);
    return dishes;
}

// Run the scraper
scrapeMenu();
