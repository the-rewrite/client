import { formatAnnot } from './../sidebar/services/frame-sync';

/**
 * @typedef {import('../types/annotator').AnnotationData} AnnotationData
 * @typedef {import('../types/api').Target } Target
 * */

/** @typedef Payload
 * @prop {Object} document
 *  @prop {string} document.title
 * @prop {Target[]} target
 * @prop {string} uri
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
  return /** @type { AnnotationMessage } */ message;
}

/**
 * @param {string[]} tags
 */
export function tagsToSingleClass(tags) {
  // FIXME This is only good for now and needs to be revisited
  if (tags.length === 0) {
    return '';
  }
  return tags[0].split(' ')[0].split(',')[0];
}
