const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// 1. 엑셀 파일 읽기
const workbook = XLSX.readFile('movies.xlsx');
const sheet_name_list = workbook.SheetNames;
const sheet = workbook.Sheets[sheet_name_list[0]];  // 첫 번째 시트를 선택

// 2. 엑셀 데이터를 JSON 형식으로 변환
const jsonData = XLSX.utils.sheet_to_json(sheet);

// 3. SQLite DB 연결
let db = new sqlite3.Database('movies.db', (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
    return;
  }
  console.log('SQLite 데이터베이스에 연결되었습니다.');
});

// 4. 테이블 생성 (만약 테이블이 없다면)
db.serialize(() => {
  // movies 테이블 생성
  db.run(`CREATE TABLE IF NOT EXISTS movies (
    ID INTEGER PRIMARY KEY,
    Title TEXT,
    Original_Title TEXT,
    Overview TEXT,
    Release_Date TEXT,
    Poster_Path TEXT,
    Backdrop_Path TEXT,
    Popularity REAL,
    Vote_Average REAL,
    Vote_Count INTEGER
  )`, (err) => {
    if (err) {
      console.error('movies 테이블 생성 오류:', err.message);
    } else {
      console.log('movies 테이블 생성 완료 또는 이미 존재.');
    }
  });

  // comments 테이블 생성
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(ID) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('comments 테이블 생성 오류:', err.message);
    } else {
      console.log('comments 테이블 생성 완료 또는 이미 존재.');
    }
  });

  // 5. 데이터 삽입
  const insertStmt = db.prepare(`INSERT INTO movies (ID, Title, Original_Title, Overview, Release_Date, Poster_Path, Backdrop_Path, Popularity, Vote_Average, Vote_Count)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  jsonData.forEach((row, index) => {
    insertStmt.run(
      row.ID,
      row.Title,
      row['Original Title'],
      row.Overview,
      row['Release Date'],
      row['Poster Path'],
      row['Backdrop Path'],
      row.Popularity,
      row['Vote Average'],
      row['Vote Count'],
      function(err) {
        if (err) {
          console.error(`데이터 삽입 오류 - 행 ${index + 1}:`, err.message);
        }
      }
    );
  });

  // 삽입 후 커밋
  insertStmt.finalize((err) => {
    if (err) {
      console.error('삽입 오류:', err.message);
    } else {
      console.log('데이터가 성공적으로 삽입되었습니다.');
    }

    // 데이터베이스 연결 종료
    db.close((err) => {
      if (err) {
        console.error('데이터베이스 종료 오류:', err.message);
      } else {
        console.log('데이터베이스 연결이 종료되었습니다.');
      }
    });
  });
});
