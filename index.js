const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3000; // 포트 번호

app.use(cors());

// SQLite DB 연결
let db = new sqlite3.Database('movies.db', (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
    return;
  }
  console.log('SQLite 데이터베이스에 연결되었습니다.');
});

// /movies API 엔드포인트 (영화 목록)
app.get('/movies', (req, res) => {
  const sql = 'SELECT ID, Title,Original_Title, Poster_Path, Vote_Average FROM movies';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('데이터 조회 오류:', err.message);
      res.status(500).send({ error: '데이터 조회 오류' });
      return;
    }
    res.json(rows);
  });
});

// /movies/:id API 엔드포인트 (영화 상세 정보)
app.get('/movies/:id', (req, res) => {
  const movieId = req.params.id;
  const sql = 'SELECT * FROM movies WHERE ID = ?';

  db.get(sql, [movieId], (err, row) => {
    if (err) {
      console.error('영화 상세 정보 조회 오류:', err.message);
      res.status(500).send({ error: '영화 상세 정보 조회 오류' });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).send({ error: '영화를 찾을 수 없습니다.' });
    }
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});

// 댓글 작성 API
app.post('/movies/:id/comments', (req, res) => {
    const movieId = req.params.id;
    const { content } = req.body;
  
    if (!content) {
      console.error('댓글 내용이 비어있습니다.');
      return res.status(400).send({ error: '댓글 내용을 입력해주세요.' });
    }
  
    const sql = 'INSERT INTO comments (movie_id, content) VALUES (?, ?)';
    db.run(sql, [movieId, content], function(err) {
      if (err) {
        console.error('댓글 작성 SQL 오류:', err.message);
        return res.status(500).send({ error: '댓글 작성 오류' });
      }
  
      res.status(201).send({
        id: this.lastID,  // 삽입된 댓글의 ID
        movie_id: movieId,
        content: content,
        created_at: new Date().toISOString()
      });
    });
  });
  
  
  
  

// 영화 상세 페이지에 해당하는 댓글 불러오기 API
app.get('/movies/:id/comments', (req, res) => {
    const movieId = req.params.id;
  
    const sql = 'SELECT * FROM comments WHERE movie_id = ? ORDER BY created_at DESC';
    db.all(sql, [movieId], (err, rows) => {
      if (err) {
        console.error('댓글 조회 오류:', err.message);
        return res.status(500).send({ error: '댓글 조회 오류' });
      }
  
      res.json(rows);  // 댓글 목록 반환
    });
  });
  