const pdf = require('pdf-parse');
const fs = require('fs');

const parseResumeResult = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        // Common skills list to check against
        const commonSkills = [
            'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust',
            'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
            'HTML', 'CSS', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'Agile', 'Scrum',
            'Machine Learning', 'AI', 'Data Analysis', 'Project Management'
        ];

        const extractedData = {
            name: extractName(text),
            email: extractEmail(text),
            phone: extractPhone(text),
            skills: extractSkills(text, commonSkills),
            raw_text: text.substring(0, 1000) // Preview first 1000 chars
        };

        return extractedData;
    } catch (error) {
        console.error('Error parsing resume:', error);
        throw error;
    }
};

const extractEmail = (text) => {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
};

const extractPhone = (text) => {
    // Matches common formats: (123) 456-7890, 123-456-7890, +1 123 456 7890
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0].trim() : '';
};

const extractSkills = (text, skillsList) => {
    const foundSkills = [];
    const lowerText = text.toLowerCase();

    skillsList.forEach(skill => {
        // Determine boundary for simple matching
        // escape special chars in skill for regex
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSkill.toLowerCase()}\\b`, 'i');
        if (regex.test(lowerText)) {
            foundSkills.push(skill);
        }
    });

    return foundSkills.join(', ');
};

const extractName = (text) => {
    // Heuristic: Name is often at the top, first non-empty line that isn't a common header
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Skip lines that look like headers or contact info
    const skipKeywords = ['resume', 'cv', 'curriculum', 'vitae', 'email', 'phone', 'address', 'contact', 'summary', 'objective'];

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];
        const isKeyword = skipKeywords.some(k => line.toLowerCase().includes(k));
        const isEmail = line.includes('@');
        const hasNumber = /\d/.test(line);

        // Name usually has 2-3 words, no numbers, no @
        if (!isKeyword && !isEmail && !hasNumber && line.split(' ').length >= 2 && line.split(' ').length <= 4) {
            return line;
        }
    }
    return '';
};

module.exports = {
    parseResumeResult
};
