import { CommentAlreadyExists, CommentDoesNotExist } from '../utils/errors';
import { asPromise } from '../utils/handlers';
import Comment from '../comment';

class CommentCache {

    static fromCache(cache) {
        const newCache = new CommentCache();
        cache.toArray().forEach(comment => newCache.addOrUpdate(comment));
        return newCache;
    }

    constructor() {
        this.comments = {};
    }

    clear = () => {
        this.comments = {};
    }

    has = (uuid) => {
        return uuid in this.comments;
    }

    addOrUpdate = (comment) => {
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
        otherCache.toArray().forEach(comment => this.addOrUpdate(comment));
    }

}

export default class CommentStorage {

    constructor() {
        this._cache = new CommentCache();
        this._stage = new CommentCache();

        this.author = {};

        this.context = null;
        this.annotationFactory = null;
        this.notifyCallback = null;
    }

    connect = (context, annotationFactory, callback) => {
        this.context = context;
        this.annotationFactory = annotationFactory;
        this.notifyCallback = callback;

        return asPromise(this.onConnect).then(this.load);
    }

    disconnect = () => {
        this.context = null;
        this.annotationFactory = null;
        this.notifyCallback = null;

        return asPromise(this.onDisconnect);
    }

    setAuthor = ({ name = undefined, email = undefined, avatar = undefined } = {}) => {
        this.author = {
            name: name,
            email: email,
            avatar: avatar,
        };
    }

    // Event handlers
    notify = () => {
        if (this.notifyCallback) {
            const comments = CommentCache.fromCache(this._cache);
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
                            this._cache.addOrUpdate(comment);
                        });
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
                            this._cache.addOrUpdate(comment);
                        });
                        this.notify();
                    }
                )
        );
    }

    get = (uuid) => {
        uuid = this._getUuid(uuid);
        return this._stage.get(uuid) || this._cache.get(uuid);
    }

    exists = (uuid) => {
        uuid = this._getUuid(uuid);
        return this._stage.has(uuid) || this._cache.has(uuid);
    }

    add = (comment, force = false) => {
        const uuid = this._getUuid(comment);
        if (!force && this._cache.has(uuid)) throw new CommentAlreadyExists('Comment ' + comment.uuid + ' already exists!');

        comment = comment.copy();
        comment.isDraft = false;
        comment.context = this.context;
        this._stage.addOrUpdate(comment);

        return (
            asPromise(this.onSubmit, comment.toJSON())
                .then(
                    (success) => {
                        if (success) {
                            this._cache.addOrUpdate(comment);
                            this._stage.pop(comment.uuid);
                            this.notify();
                        }
                    }
                )
        );
    }

    update = (comment) => {
        if (!this.exists(comment)) throw new CommentDoesNotExist(comment.uuid);
        return this.add(comment, true);
    }

    patch = (comment, patch) => {
        if (!this.exists(comment)) throw new CommentDoesNotExist(comment.uuid);

        this._stage.addOrUpdate(comment.copy().applyPatch(patch));

        return (
            asPromise(this.onPatch, comment.uuid, patch)
                .then(
                    (success) => {
                        if (success) {
                            this._cache.addOrUpdate(this._stage.pop(comment.uuid));
                            this.notify();
                        }
                    }
                )
        );
    }

    // Drafts

    create = (state) => {
        return new Comment({
            context: this.context,
            authorName: this.author.name,
            authorEmail: this.author.email,
            authorAvatar: this.author.avatar,
            isDraft: true,
            ...state,
        });
    }

    stage = (comment) => {
        comment.isDraft = true;
        this._stage.addOrUpdate(comment);
        this.notify();
    }

    commit = (uuid) => {
        uuid = this._getUuid(uuid);
        const comment = this._stage.get(uuid);

        if (!comment) throw new CommentDoesNotExist(uuid);

        return this.add(comment);
    }

    discard = (uuid) => {
        uuid = this._getUuid(uuid);
        const comment = this._stage.get(uuid);

        if (!comment) throw new CommentDoesNotExist(uuid);

        this._stage.pop(uuid);
        this.notify();
    }

    _getUuid = (commentUuid) => {
        return commentUuid instanceof Comment ? commentUuid.uuid : commentUuid;
    }

    // Hooks for subclasses to modify behaviour
    onConnect = () => {}
    onDisconnect = () => {}

    onLoad = () => {}
    onSync = () => {}
    onSubmit = (comment) => {}
    onPatch = (uuid, patch) => {}

}
