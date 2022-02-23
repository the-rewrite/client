import { formatAnnot } from './../sidebar/services/frame-sync';
import { THE_REWRITE_TAG_CATEGORY } from './categories';

/**
 * @typedef {import('../types/annotator').AnnotationData} AnnotationData
 * @typedef {import('../types/api').Target } Target
 * */

/** @typedef Payload
 * @prop {Object} document
 *  @prop {string} document.title
 * @prop {Target[]} target
 * @prop {string} uri
 * @prop {string} id
 * @prop {string[]} tags
 */

/**
 * @typedef AnnotationMessage
 * @prop {string} tag
 * @prop {Payload} msg
 * */

/**
 * @param {AnnotationData} annotation
 * @return {AnnotationMessage}
 */
export function formatAnnotation(annotation) {
  const message = formatAnnot(annotation);
  message.msg.tags = annotation.tags;
  message.msg.id = annotation.id;
  return /** @type { AnnotationMessage } */ message;
}

const THE_REWRITE_V1_TO_V2_TAGS = {
  definition: [THE_REWRITE_TAG_CATEGORY, 'definition'].join('_'),
  addition: [THE_REWRITE_TAG_CATEGORY, 'addition'].join('_'),
  deletion: [THE_REWRITE_TAG_CATEGORY, 'deletion'].join('_'),
  correction: [THE_REWRITE_TAG_CATEGORY, 'correction'].join('_'),
  speculation: [THE_REWRITE_TAG_CATEGORY, 'speculation'].join('_'),
};

/**
 * @param {string[]} tags
 */
export function categoriesToClasses(tags) {
  // FIXME This is only good for now and needs to be revisited
  if (!tags || tags.length === 0) {
    return '';
  }
  tags = tags.map(t => THE_REWRITE_V1_TO_V2_TAGS[t] || t);
  return tags.join(' ');
}
