const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', '..')));

// تحميل جميع الراوترات تلقائيًا من جميع مجلدات الراوتر
const routersFolders = ['userRouter', 'dashboardRouter', 'deviceRouter', 'reportRouter'];
routersFolders.forEach(folder => {
  const routersPath = path.join(__dirname, folder);
  if (fs.existsSync(routersPath)) {
    fs.readdirSync(routersPath).forEach(file => {
      if (file.endsWith('Router.js')) {
        const router = require(path.join(routersPath, file));
        app.use('/', router);
      }
    });
  }
});

// تشغيل السيرفر
app.listen(4000, () => console.log('🚀 app.js running on http://localhost:4000'));  