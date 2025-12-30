-- Learning sessions tracking (face verified in/out + photos)
-- Run this in your `student_manager` database.

CREATE TABLE IF NOT EXISTS learning_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  lesson_id INT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  duration_seconds INT NULL,
  login_photo_url TEXT NULL,
  logout_photo_url TEXT NULL,
  face_verified_in TINYINT(1) NOT NULL DEFAULT 0,
  face_verified_out TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('started','ended','abandoned') NOT NULL DEFAULT 'started',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ls_student (student_id),
  INDEX idx_ls_subject (subject_id),
  INDEX idx_ls_lesson (lesson_id),
  INDEX idx_ls_started (started_at),
  CONSTRAINT fk_ls_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_ls_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_ls_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
