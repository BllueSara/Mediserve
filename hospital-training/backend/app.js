const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// إعداد static files
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname, '..', '..')));

const { authenticateToken, upload } = require('./middlewares');

// تحميل جميع الراوترات تلقائيًا من جميع مجلدات الراوتر
const routersFolders = [
  'userRouter',
  'dashboardRouter',
  'deviceRouter',
  'reportRouter',
  'networkRouter',
  'updateRouter',
  'deleteRouter',
  'maintanceRouter',
  'ticketRouter',
  'getRouter',
  'addRouter'
];
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

require('./cron/maintenanceDueCron');
require('./cron/externalTicketFollowupCron');
require('./networkController/contractExpiryCron');

// تشغيل السيرفر
app.listen(4000, () => console.log('🚀 app.js running on http://localhost:4000'));

// تصدير الميدلويرز إذا احتاجتها الراوترات
module.exports = { authenticateToken, upload };  