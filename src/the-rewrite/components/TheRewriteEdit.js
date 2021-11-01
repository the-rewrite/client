import ThreadCard from './ThreadCard';

export function TheRewriteEdit({ thread, update, hideReplies }) {
  return (
    <div class="TheRewriteEditPanel">
      <ThreadCard
        thread={thread}
        update={update}
        hideReplies={true}
        canEdit={true}
      />
    </div>
  );
}
