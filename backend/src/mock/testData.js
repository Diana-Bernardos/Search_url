// src/mock/testData.js
const mockData = {
  urls: [
    {
      url: "https://www.example.com",
      title: "Example Domain",
      description: "Example website description",
      properties: {
        metadata: {
          keywords: "example, test, demo",
          author: "Example Author",
          robots: "index, follow"
        },
        content: {
          headings: {
            h1: 1,
            h2: 3,
            h3: 5
          },
          links: 10,
          images: 5,
          paragraphs: 8
        },
        social: {
          ogTitle: "Example Title",
          ogDescription: "Social media description",
          ogImage: "https://example.com/image.jpg"
        }
      }
    }
  ]
};

const testUsers = [
  {
    username: "testuser",
    email: "test@example.com",
    password: "Test123!"
  },
  {
    username: "demouser",
    email: "demo@example.com",
    password: "Demo123!"
  }
];

module.exports = { mockData, testUsers };