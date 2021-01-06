import { asPromise } from '../utils/handlers';
import Comment from '../comment';
import CommentStorage from './base';

const Axios = require('axios');

export default class RemoteCommentStorage extends CommentStorage {

    constructor(baseURL) {
        super();
        this.baseURL = baseURL;
        this._axios = null;
        this._greatestTsUpdated = null;
    }

    get axios() {
        if (this._axios === null) {
            this._axios = this.createAxios();
        }
        return this._axios;
    }

    createAxios = () => {
        return Axios.create({
            baseURL: this.baseURL,
        });
    };

    onPreConnect = () => {};

    onConnect = () => {
        return (
            asPromise(this.onPreConnect)
                .then(() => {
                    this.axios.get('whoami')
                        .then(response => {
                            const userInfo = response.data.data.attributes;
                            if (userInfo !== undefined) {
                                this.setAuthor({
                                    name: userInfo.name,
                                    email: userInfo.email,
                                    avatar: userInfo.avatar,
                                });
                            }
                        })
                        .catch(err => {
                            console.error('Could not get user information from server.', err);
                        }); ;
                })
                .then(() => {
                    this._timer = setInterval(this.sync, 5000);
                })
        );
    };

    onDisconnect = () => {
        clearInterval(this._timer);
    };

    onLoad = () => {
        return (
            this.axios
                .get('comments', { params: this.context })
                .then((response) => {
                    return response.data.data.map(comment => { return Comment.fromJSON(comment.attributes, this.annotationFactory); });
                })
        );
    };

    onSync = () => {
        return (
            this.axios
                .get('comments', { params: { ...this.context, ...(this._greatestTsUpdated !== null && { since: this._greatestTsUpdated }) } })
                .then((response) => {
                    return response.data.data.map(comment => {
                        const newComment = Comment.fromJSON(comment.attributes, this.annotationFactory);
                        if (newComment.tsUpdated) {
                            this._greatestTsUpdated = Math.max(this._greatestTsUpdated, newComment.tsUpdated);
                        }
                        return newComment;
                    });
                })
        );
    };

    onSubmit = (comment) => {
        return (
            this.axios
                .put(
                    'comments/' + comment.uuid,
                    { data: { type: 'comments', id: comment.uuid, attributes: comment } }
                )
        );
    };

    onPatch = (uuid, patch) => {
        return (
            this.axios
                .patch(
                    'comments/' + uuid,
                    { data: { type: 'comment_patch', id: uuid, attributes: { context: this.context, patch: patch } } }
                )
        );
    }

}
