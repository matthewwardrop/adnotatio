import Comment from '../comment';
import CommentStorage from './base';
import { NotImplementedError } from '../utils/errors';

export default class LocalCommentStorage extends CommentStorage {

    onConnect = () => {
        window.addEventListener('storage', this.sync);
    }

    onDisconnect = () => {
        window.removeEventListener('storage', this.sync);
    }

    onLoad = () => {
        const comments = (
            (JSON.parse(window.localStorage.getItem('comments')) || [])
                .map(comment => { return Comment.fromJSON(comment, this.annotationFactory); })
        );
        return comments;
    }

    onSync = () => {
        const comments = (
            (JSON.parse(window.localStorage.getItem('comments')) || [])
                .map(comment => { return Comment.fromJSON(comment, this.annotationFactory); })
        );
        return comments;
    }

    onSubmit = (comment) => {
        const comments = this._cache.toArray().concat([comment]);
        window.localStorage.setItem('comments', JSON.stringify(comments));
        return true;
    }

    onPatch = (uuid, patch) => {
        throw new NotImplementedError('`onPatch` not implemented for `LocalCommentStorage`.');
    }

}
