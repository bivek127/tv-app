CREATE TABLE task_dependencies (
  blocking_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocked_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (blocking_task_id, blocked_task_id),
  CHECK (blocking_task_id != blocked_task_id)
);

CREATE INDEX idx_task_deps_blocking ON task_dependencies(blocking_task_id);
CREATE INDEX idx_task_deps_blocked ON task_dependencies(blocked_task_id);
