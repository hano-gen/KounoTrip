// index.js
require('dotenv').config(); // .envファイルを読み込む設定
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js'); // Supabaseを使う準備

const app = express();
const PORT = process.env.PORT || 3000; // ネット公開時は指定されたポートを使う設定

// === Supabaseの設定 ===
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// === データの準備 ===
let regionsData, poisData, coursesData;
try {
    regionsData = require('./public/regions.json');
    poisData = require('./public/pois.json');
    coursesData = require('./public/courses.json');
} catch (e) {
    console.warn("データ読み込みエラー:", e);
    regionsData = []; poisData = []; coursesData = [];
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === API ===
app.get('/api/regions', (req, res) => res.json(regionsData));
app.get('/api/pois', (req, res) => res.json(poisData));
app.get('/api/courses', (req, res) => res.json(coursesData));

// ★★★ ログ保存（Supabase版） ★★★
app.post('/api/log', async (req, res) => {
    const logData = req.body;
    
    // 日本時間を計算
    const jpTime = new Date().toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    console.log("【受信】", logData.action, jpTime);

    // Supabaseの 'logs' テーブルに追加
    const { error } = await supabase
        .from('logs')
        .insert({
            user_id: logData.userId,
            action: logData.action,
            spot_id: logData.spotId,
            timestamp: jpTime // 日本時間の文字列を保存
        });

    if (error) {
        console.error('【DB保存失敗】', error);
        res.status(500).json({ status: 'error', error: error.message });
    } else {
        console.log('【DB保存成功】クラウドに記録しました');
        res.json({ status: 'ok' });
    }
});

// SPA対応（その他はindex.htmlへ）
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});

/*
// index.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// === 1. データの準備 ===
// データベースの代わりに、今のJSONファイルをサーバーに読み込ませます
const regionsData = require('./public/regions.json');
const poisData = require('./public/pois.json');
const coursesData = require('./public/courses.json');

// JSON形式のデータを受け取れるようにする
app.use(express.json());

// === 2. フロントエンドの公開 ===
// publicフォルダの中身（HTML, CSS, 画像など）はそのまま公開
app.use(express.static(path.join(__dirname, 'public')));


// === 3. API作成 ===

// 地域データ: http://localhost:3000/api/regions
app.get('/api/regions', (req, res) => {
    // 読み込んだデータをそのまま返す
    res.json(regionsData);
});

// スポットデータ: http://localhost:3000/api/pois
app.get('/api/pois', (req, res) => {
    res.status(200).json(poisData);
});

// コースデータ: http://localhost:3000/api/courses
app.get('/api/courses', (req, res) => {
    res.json(coursesData);
});

// 行動ログ保存用API
app.post('/api/log', (req, res) => {
    const logData = req.body;
    
    // ★★★ 追加：ここで日本時間 (JST) に書き換える ★★★
    // スマホから送られてきた時刻は捨てて、サーバーの現在時刻を使います
    logData.timestamp = new Date().toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    console.log("【受信確認】", logData); // 確認用

    const logFilePath = path.join(__dirname, 'user_logs.jsonl');
    const logString = JSON.stringify(logData) + '\n';

    fs.appendFile(logFilePath, logString, (err) => {
        if (err) {
            console.error('【保存失敗】', err);
            res.status(500).json({ status: 'error' });
        } else {
            res.json({ status: 'ok' });
        }
    });
});

// === 4. その他のアクセス対策 ===
// ページが見つからない場合などはindex.htmlに返す（SPA対応）
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
*/