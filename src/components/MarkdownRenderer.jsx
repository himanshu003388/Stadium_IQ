import React, { memo } from 'react';
import PropTypes from 'prop-types';

function parseMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  function flushList() {
    if (listItems.length > 0) {
      const listId = crypto.randomUUID();
      elements.push(
        <ul key={`ul-${listId}`} style={{ margin: '6px 0', paddingLeft: '16px' }}>
          {listItems.map((item) => (
            <li key={crypto.randomUUID()}>{item}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^• (.+)$/);
    if (bulletMatch) {
      const boldProcessed = bulletMatch[1]
        .split(/\*\*(.*?)\*\*/)
        .map((part, j) => (j % 2 === 1 ? <strong key={crypto.randomUUID()}>{part}</strong> : part));
      listItems.push(<React.Fragment key={crypto.randomUUID()}>{boldProcessed}</React.Fragment>);
      continue;
    }
    flushList();
    const boldProcessed = line
      .split(/\*\*(.*?)\*\*/)
      .map((part, j) => (j % 2 === 1 ? <strong key={crypto.randomUUID()}>{part}</strong> : part));
    elements.push(
      <p key={crypto.randomUUID()} style={{ margin: '4px 0' }}>
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
