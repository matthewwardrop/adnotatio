'use strict';

import Comment from '../comment';
import {asPromise} from '../utils/handlers';
import {CommentAlreadyExists, CommentDoesNotExist, NotImplementedError} from '../utils/errors';


class CommentCache {

    static fromCache(cache) {
        let newCache = new CommentCache();
        cache.toArray().forEach(comment => newCache.add_or_update(comment));
        return newCache;
    }

    constructor() {
        this.comments = {}
    }

    clear = () => {
        this.comments = {};
    }

    has = (uuid) => {
        return this.comments.hasOwnProperty(uuid);
    }

    add_or_update = (comment) => {
        this.comments[comment.uuid] = comment;
    }

    get = (uuid) => {
        return this.comments[uuid];
    }

    toArray = () => {
        return Object.values(this.comments);
    }

    pop = (uuid) => {
        try {
            return this.comments[uuid];
        } finally {
            delete this.comments[uuid];
        }
    }

    union = (otherCache) => {
        otherCache.toArray().forEach(comment => this.add_or_update(comment));
    }

}


export default class CommentStorage {

    constructor() {
        this._cache = new CommentCache();
        this._stage = new CommentCache();
        this.context = null;
        this.author = {};
        this.notifyCallback = null;
    }

    connect = (context, callback) => {
        this.context = context,
        this.notifyCallback = callback;

        return asPromise(this.onConnect).then(this.load);
    }

    disconnect = () => {
        this.context = null;
        this.notifyCallback = null;

        return asPromise(this.onDisconnect);
    }

    setAuthor = ({name=undefined, email=undefined, avatar=undefined} = {}) => {
        this.author = {
            name: name,
            email: email,
            avatar: avatar
        }
    }

    // Event handlers
    notify = () => {
        if (this.notifyCallback) {
            let comments = CommentCache.fromCache(this._cache);
            comments.union(this._stage);
            this.notifyCallback(comments.toArray());
        }
    }

    // Imperative actions

    load = () => {
        return (
            asPromise(this.onLoad)
            .then(
                (comments) => {
                    this._cache.clear();
                    comments.forEach(comment => {
                        this._cache.add_or_update(comment);
                    })
                    this.notify();
                }
            )
        );
    }

    sync = () => {
        return (
            asPromise(this.onSync)
            .then(
                (newComments) => {
                    newComments.forEach(comment => {
                        this._cache.add_or_update(comment);
                    });
                    this.notify();
                }
            )
        );
    }

    get = (uuid) => {
        uuid = this._get_uuid(uuid);
        return this._stage.get(uuid) || this._cache.get(uuid);
    }

    exists = (uuid) => {
        uuid = this._get_uuid(uuid);
        return this._stage.has(uuid) || this._cache.has(uuid);
    }

    add = (comment) => {
        if (this._cache.has(comment)) throw new CommentAlreadyExists(comment.uuid);

        comment.isDraft = false;
        comment.context = this.context;
        this._stage.add_or_update(comment);

        return (
            asPromise(this.onSubmit, comment)
            .then(
                (success) => {
                    if (success) {
                        this._cache.add_or_update(comment);
                        this._stage.pop(comment.uuid);
                        this.notify();
                    }
                }
            )
        );
    }

    update = (comment) => {
        if (!this.exists(comment)) throw new CommentDoesNotExist(comment.uuid);

        this._stage.add_or_update(comment);

        return this.add(comment);
    }

    // Drafts

    create = (state) => {
        return new Comment({
            context: this.context,
            authorName: this.author.name,
            authorEmail: this.author.email,
            authorAvatar: this.author.avatar,
            ...state
        });
    }

    stage = (comment) => {
        comment.isDraft = true;
        this._stage.add_or_update(comment);
        this.notify();
    }

    commit = (uuid) => {
        uuid = this._get_uuid(uuid);
        let comment = this._stage.get(uuid);

        if (!comment) throw new CommentDoesNotExist(uuid);

        return this.add(comment);
    }

    discard = (uuid) => {
        uuid = this._get_uuid(uuid);
        let comment = this._stage.get(uuid);

        if (!comment) throw new CommentDoesNotExist(uuid);

        this._stage.pop(uuid);
        this.notify();
    }

    _get_uuid = (comment_uuid) => {
        return comment_uuid instanceof Comment ? comment_uuid.uuid : comment_uuid;
    }

    // Hooks for subclasses to modify behaviour
    onConnect = () => {}
    onDisconnect = () => {}

    onLoad = () => {}
    onSync = () => {}
    onSubmit = (comment) => {}

}
