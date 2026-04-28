export const styles = `.linear-view-diff-inline-button {
  align-items: center;
  background: color-mix(in srgb, currentColor 9%, transparent);
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 6px;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  gap: 6px;
  height: 28px;
  margin-left: 8px;
  padding: 0 10px;
}

.linear-view-diff-inline-button:hover {
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.linear-view-diff-backdrop {
  background: rgb(0 0 0 / 48%);
  inset: 0;
  position: fixed;
  z-index: 2147483647;
}

.linear-view-diff-modal {
  background: #101114;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 12px;
  box-shadow: 0 24px 80px rgb(0 0 0 / 45%);
  color: #f3f4f6;
  display: grid;
  grid-template-rows: auto 1fr;
  inset: 40px;
  overflow: hidden;
  position: fixed;
  z-index: 2147483647;
}

.linear-view-diff-header {
  align-items: center;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
  display: flex;
  gap: 12px;
  min-height: 56px;
  padding: 0 16px;
}

.linear-view-diff-title {
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;
}

.linear-view-diff-title strong,
.linear-view-diff-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linear-view-diff-title span {
  color: #a5acb8;
  font-size: 12px;
}

.linear-view-diff-close,
.linear-view-diff-open-pr {
  background: #1d2028;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  padding: 8px 10px;
  text-decoration: none;
}

.linear-view-diff-body {
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  min-height: 0;
}

.linear-view-diff-sidebar {
  border-right: 1px solid rgb(255 255 255 / 10%);
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 0;
}

.linear-view-diff-summary {
  border-bottom: 1px solid rgb(255 255 255 / 10%);
  color: #a5acb8;
  display: grid;
  font-size: 12px;
  gap: 4px;
  padding: 12px;
}

.linear-view-diff-tree {
  min-height: 0;
}

.linear-view-diff-content {
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

.linear-view-diff-file-list {
  display: grid;
  gap: 16px;
}

.linear-view-diff-state {
  align-items: center;
  color: #c7ccd5;
  display: flex;
  height: 100%;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.linear-view-diff-error {
  color: #ffb4ab;
}

.linear-view-diff-raw-patch {
  background: #0b0c0f;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 8px;
  color: #f3f4f6;
  margin: 0;
  overflow: auto;
  padding: 12px;
}
`;
