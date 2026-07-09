import React, { memo } from 'react';
import PropTypes from 'prop-types';

function parseMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let idx = 0;

  function flushList() {
    if (listItems.length > 0) {
      const listKey = idx++;
      elements.push(
        <ul key={`ul-${listKey}`} style={{ margin: '6px 0', paddingLeft: '16px' }}>
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line && lines.length === 1) break;
    const bulletMatch = line.match(/^• (.+)$/);
    if (bulletMatch) {
      const itemKey = idx++;
      const parts = bulletMatch[1].split(/\*\*(.*?)\*\*/);
      const boldProcessed = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={`strong-${itemKey}-${part.slice(0, 8)}`}>{part}</strong> : part,
      );
      listItems.push(<li key={`li-${itemKey}`}>{boldProcessed}</li>);
      continue;
    }
    flushList();
    if (!line) continue;
    const pKey = idx++;
    const parts = line.split(/\*\*(.*?)\*\*/);
    const boldProcessed = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={`strong-${pKey}-${part.slice(0, 8)}`}>{part}</strong> : part,
    );
    elements.push(
      <p key={`p-${pKey}`} style={{ margin: '4px 0' }}>
        {boldProcessed}
      </p>,
    );
  }
  flushList();
  return elements;
}

const MarkdownRenderer = memo(function MarkdownRenderer({ text }) {
  return <>{parseMarkdown(text)}</>;
});

MarkdownRenderer.propTypes = {
  text: PropTypes.string.isRequired,
};

export default MarkdownRenderer;
