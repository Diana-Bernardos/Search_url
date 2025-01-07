// src/services/scraperService.js
const axios = require('axios');
const cheerio = require('cheerio');

class ScraperService {
    async scrapeWebsite(url) {
        try {
            const response = await axios.get(url, {
                timeout: process.env.SCRAPER_TIMEOUT || 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ScraperBot/1.0;)'
                }
            });

            const $ = cheerio.load(response.data);
            
            return {
                metadata: this.extractMetadata($),
                content: this.extractContent($),
                statistics: this.generateStatistics($)
            };
        } catch (error) {
            throw new Error(`Error al scrapear ${url}: ${error.message}`);
        }
    }

    extractMetadata($) {
        return {
            title: $('title').text().trim(),
            description: $('meta[name="description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            author: $('meta[name="author"]').attr('content') || '',
            favicon: $('link[rel="icon"]').attr('href') || ''
        };
    }

    extractContent($) {
        return {
            headings: {
                h1: this.extractHeadings($, 'h1'),
                h2: this.extractHeadings($, 'h2'),
                h3: this.extractHeadings($, 'h3')
            },
            links: this.extractLinks($),
            images: this.extractImages($),
            text: this.extractText($)
        };
    }

    generateStatistics($) {
        return {
            wordCount: this.countWords($('body').text()),
            linkCount: $('a').length,
            imageCount: $('img').length,
            headingCount: $('h1, h2, h3, h4, h5, h6').length,
            paragraphCount: $('p').length
        };
    }

    extractHeadings($, tag) {
        const headings = [];
        $(tag).each((i, elem) => {
            headings.push($(elem).text().trim());
        });
        return headings;
    }

    extractLinks($) {
        const links = [];
        $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                links.push({
                    text: $(elem).text().trim(),
                    url: href
                });
            }
        });
        return links;
    }

    extractImages($) {
        const images = [];
        $('img').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src) {
                images.push({
                    src: src,
                    alt: $(elem).attr('alt') || '',
                    width: $(elem).attr('width') || '',
                    height: $(elem).attr('height') || ''
                });
            }
        });
        return images;
    }

    extractText($) {
        return $('p').map((i, elem) => $(elem).text().trim()).get();
    }

    countWords(text) {
        return text.trim().split(/\s+/).length;
    }
}
module.exports = {
    ScraperService: new ScraperService(),
    DatabaseService: new DatabaseService()
};