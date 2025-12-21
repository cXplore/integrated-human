const fs = require('fs');
const path = require('path');

const coursesDir = path.join(__dirname, '..', 'content', 'courses');
const dirs = fs.readdirSync(coursesDir);

for (const dir of dirs) {
  const coursePath = path.join(coursesDir, dir, 'course.json');
  if (fs.existsSync(coursePath)) {
    try {
      const course = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));

      // Determine tier based on price and level
      let tier;
      const price = course.price || 0;
      const level = (course.level || '').toLowerCase();
      const category = (course.category || '').toLowerCase();

      if (price === 0 || category === 'free') {
        tier = 'intro';
      } else if (category === 'flagship' || price >= 197) {
        tier = 'flagship';
      } else if (level === 'advanced' || price >= 147) {
        tier = 'advanced';
      } else if (level === 'intermediate' || price >= 97) {
        tier = 'intermediate';
      } else {
        tier = 'beginner';
      }

      // Add tier if not present
      if (!course.tier) {
        course.tier = tier;
        fs.writeFileSync(coursePath, JSON.stringify(course, null, 2) + '\n');
        console.log(`${dir}: tier=${tier} (price=${price}, level=${level})`);
      } else {
        console.log(`${dir}: already has tier=${course.tier}`);
      }
    } catch (e) {
      console.error(`Error processing ${dir}: ${e.message}`);
    }
  }
}
console.log('\nDone!');
