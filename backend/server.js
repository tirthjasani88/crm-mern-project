require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

connectDB(); // connect to MongoDB

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 CRM Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});