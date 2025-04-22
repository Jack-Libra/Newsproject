const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI; // 線上 MongoDB URI

// MongoDB 配置
const dbName = 'project'; // 資料庫名稱
const collectionName = 'news'; // 集合名稱

// 中間件
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // 提供靜態文件支援

// 獲取新聞列表（分頁）
app.get('/news', async (req, res) => {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // 分頁參數
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 9;

    // 獲取總數據量
    const totalNews = await collection.countDocuments({ title: { $ne: null } });
    const totalPages = Math.ceil(totalNews / pageSize);

    // 抓取對應頁數的新聞
    const newsList = await collection.find({ title: { $ne: null } })
      .sort({ published_at: -1 }) // 按發布日期降序排序
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    res.json({
      news: newsList,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: '無法讀取新聞資料' });
  } finally {
    await client.close();
  }
});

// 獲取單篇新聞
app.get('/news/:id', async (req, res) => {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const news = await collection.findOne({ _id: new ObjectId(req.params.id) });

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json(news);
  } catch (error) {
    console.error('Error fetching news by ID:', error);
    res.status(500).json({ error: '無法讀取新聞資料' });
  } finally {
    await client.close();
  }
});

// 啟動服務器
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
