import React, { memo } from 'react';
import PropTypes from 'prop-types';

function parseMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '6px 0', paddingLeft: '16px' }}>
          {listItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>,
      );
      listItems = [];
      inList = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^• (.+)$/);
    if (bulletMatch) {
      inList = true;
      const boldProcessed = bulletMatch[1].split(/\*\*(.*?)\*\*/).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
      );
      listItems.push(<React.Fragment key={i}>{boldProcessed}</React.Fragment>);
      continue;
    }
    flushList();
    const boldProcessed = line.split(/\*\*(.*?)\*\*/).map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
    );
    elements.push(<p key={`p-${i}`} style={{ margin: '4px 0' }}>{boldProcessed}</p>);
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
