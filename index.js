"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidTypeException = exports.DimensionsException = exports.CreationException = exports.CopyFileException = exports.License = exports.IconSet = exports.IconGroup = exports.Icon = void 0;
const crypto_1 = require("crypto");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
/**
 * @return string
 */
function globallyUniqueIdentifier() {
    return (0, crypto_1.randomUUID)().toUpperCase();
}
/**
 * @param Date time
 *
 * Desired format:
 * YYYY-mm-dd hh:mm:ss
 * 2000-01-01 00:00:00
 *
 * Fortunately Sweden has that format
 *
 * @return string
 */
function formattedDateString(time = new Date()) {
    return time.toLocaleString('sv-SE');
}
/**
 * @param filename
 * @param baseDirectory
 *
 * @return string
 */
function uniqueFilename(filename, baseDirectory) {
    filename = cleanString(ltrim(filename, '.'));
    const firstCheckPath = baseDirectory + path.sep + filename;
    if (fs.existsSync(firstCheckPath) === false) {
        return filename;
    }
    const info = {
        extension: path.extname(filename),
        filename: path.basename(filename),
    };
    const ext = info['extension'];
    const component = info['filename'];
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const newFilename = component + '.' + counter + '.' + ext;
        const newPath = baseDirectory + path.sep + newFilename;
        if (fs.existsSync(newPath) === false) {
            filename = newFilename;
            break;
        }
        counter++;
    }
    return filename;
}
/**
 * @param string
 *
 * @return undefined|string
 */
function cleanString(string) {
    return string.replace(/#[^a-z0-9@\\.]+#/, '-').toLowerCase();
}
function ltrim(string, charlist) {
    // Discuss at: https://locutus.io/php/ltrim/
    // Original by: Kevin van Zonneveld (https://kvz.io)
    charlist =
        charlist === undefined
            ? ' \\s\u00A0'
            : (charlist + '').replace(/([[\]().?/*{}+$^:])/g, '$1');
    const regex = new RegExp('^[' + charlist + ']+', 'g');
    return (string + '').replace(regex, '');
}
class IconJar {
    /**
     * IconJar constructor.
     *
     * @param                          name
     * @param Array<IconGroup|IconSet> children
     */
    constructor(name, children = []) {
        this.EXT = 'iconjar';
        this.VERSION = 2.0;
        this.GZ_COMPRESSION_LEVEL = 1;
        /**
         * @var undefined|string
         */
        this.name = undefined;
        /**
         * @var Array<IconGroup|IconSet>
         */
        this.children = [];
        /**
         * @var array
         */
        this.groups = {};
        /**
         * @var array
         */
        this.sets = {};
        /**
         * @var array
         */
        this.icons = {};
        /**
         * @var array
         */
        this.licenses = {};
        /**
         * @var undefined|string
         */
        this.saveLocation = undefined;
        this.name = name;
        this.children = children;
    }
    /**
     * @param IconSet set
     *
     * @return this
     */
    addSet(set) {
        this.children[this.children.length] = set;
        return this;
    }
    /**
     * @param IconGroup group
     *
     * @return this
     */
    addGroup(group) {
        this.children[this.children.length] = group;
        return this;
    }
    /**
     * @param IconGroup|IconSet object
     */
    isGroup(object) {
        return object.addSet !== undefined;
    }
    /**
     * @param IconGroup|IconSet object
     */
    isSet(object) {
        return object.icons !== undefined;
    }
    /**
     * @param array children
     */
    compileArray(children) {
        children.forEach((child) => {
            if (this.isSet(child)) {
                this.compileSet(child);
            }
            else if (this.isGroup(child)) {
                this.compileGroup(child);
            }
        });
    }
    compileSet(set) {
        const dict = {
            name: set.name,
            identifier: set.identifier,
            sort: set.sort,
            description: set.description !== undefined ? set.description : '',
            date: formattedDateString(set.date),
        };
        if (set.group instanceof IconGroup) {
            dict['parent'] = set.group.identifier;
        }
        if (set.license instanceof License) {
            dict['licence'] = this.compileLicense(set.license);
        }
        this.sets[set.identifier] = dict;
        set.icons.forEach((icon) => {
            this.compileIcon(icon);
        });
    }
    /**
     * @param Icon icon
     *
     * @return string
     * @throws CopyFile
     * @throws CopyFileException
     * @throws DimensionsException
     */
    compileIcon(icon) {
        icon.validate();
        const saveLocation = this.saveLocation + path.sep + 'icons';
        const filename = uniqueFilename(icon.file, saveLocation);
        const dict = {
            name: icon.name,
            width: icon.width,
            height: icon.height,
            type: icon.type,
            file: filename,
            date: formattedDateString(icon.date),
            tags: icon.tagsString() !== undefined ? icon.tagsString() : '',
            identifier: icon.identifier,
            parent: icon.set.identifier,
            unicode: icon.unicode !== undefined ? icon.unicode : '',
            description: icon.description !== undefined ? icon.description : '', // cannot be null
        };
        if (icon.license instanceof License) {
            dict['licence'] = this.compileLicense(icon.license);
        }
        this.icons[icon.identifier] = dict;
        try {
            fs.copyFileSync(icon.filePath, saveLocation + path.sep + filename);
        }
        catch (error) {
            throw new CopyFileException(error.message);
        }
        return icon.identifier;
    }
    /**
     * @param License license
     *
     * @return null|string
     */
    compileLicense(license) {
        if (this.licenses[license.identifier] === undefined ||
            this.licenses[license.identifier] === null) {
            this.licenses[license.identifier] = {
                name: license.name,
                identifier: license.identifier,
                url: license.url,
                text: license.description !== undefined
                    ? license.description
                    : '', // cannot be null
            };
        }
        return license.identifier;
    }
    /**
     * @param IconGroup group
     *
     * @return null|string
     */
    compileGroup(group) {
        const dict = {
            name: group.name,
            identifier: group.identifier,
            sort: group.sort,
            description: group.description !== undefined ? group.description : '',
        };
        if (group.group instanceof IconGroup) {
            dict['parent'] = group.group.identifier;
        }
        this.groups[group.identifier] = dict;
        this.compileArray(group.getChildren());
        return group.identifier;
    }
    /**
     * @param pathToSave
     *
     * @return string
     * @throws CreationException
     */
    save(pathToSave) {
        const saveDir = pathToSave + path.sep + this.name + '.' + this.EXT;
        this.saveLocation = saveDir;
        try {
            fs.mkdirSync(saveDir);
        }
        catch (error) {
            throw new CreationException(error.message);
        }
        const iconDir = saveDir + path.sep + 'icons';
        try {
            fs.mkdirSync(iconDir);
        }
        catch (error) {
            throw new CreationException(error.message);
        }
        this.compileArray(this.children);
        const dict = {
            meta: {
                version: this.VERSION,
                date: formattedDateString(),
            },
            groups: this.groups,
            sets: this.sets,
            licences: this.licenses,
            items: this.icons,
        };
        const json = JSON.stringify(dict);
        const jsonData = zlib.gzipSync(json, {
            level: this.GZ_COMPRESSION_LEVEL,
        });
        const metaFile = saveDir + path.sep + 'META';
        try {
            fs.writeFileSync(metaFile, jsonData);
        }
        catch (error) {
            throw new CreationException(error.message);
        }
        return saveDir;
    }
}
exports.default = IconJar;
class Icon {
    /**
     * Icon constructor.
     *
     * @param string name
     * @param string fileOnDisk
     * @param number type
     */
    constructor(name = 'Untitled Icon', fileOnDisk, type) {
        /**
         * @var undefined|string
         */
        this.filePath = undefined;
        /**
         * @var undefined|string
         */
        this.file = undefined;
        /**
         * @var undefined|string
         */
        this.name = undefined;
        /**
         * @var undefined|string
         */
        this.identifier = null;
        /**
         * @var undefined|string
         */
        this.description = '';
        /**
         * @var undefined|License
         */
        this.license = null;
        /**
         * @var number
         */
        this.type = Icon.TYPE_UNKNOWN;
        /**
         * @var string[]
         */
        this.tags = [];
        /**
         * @var number
         */
        this.width = 0;
        /**
         * @var number
         */
        this.height = 0;
        /**
         * @var undefined|Date
         */
        this.date = undefined;
        /**
         * @var undefined|string
         */
        this.unicode = undefined;
        /**
         * @var undefined|Set
         */
        this.set = undefined;
        this.name = name;
        this.filePath = fileOnDisk;
        this.file = path.basename(String(this.filePath));
        this.type =
            typeof type !== 'undefined' ? type : Icon.getType(fileOnDisk);
        this.identifier = globallyUniqueIdentifier();
    }
    /**
     * @param file
     *
     * @return number
     */
    static getType(file) {
        const ext = path.extname(file);
        if (ext === null) {
            return Icon.TYPE_UNKNOWN;
        }
        switch (ext.toLowerCase()) {
            case '.svg':
                return Icon.TYPE_SVG;
            case '.png':
                return Icon.TYPE_PNG;
            case '.gif':
                return Icon.TYPE_GIF;
            case '.pdf':
                return Icon.TYPE_PDF;
            case '.icns':
                return Icon.TYPE_ICNS;
            case '.webp':
                return Icon.TYPE_WEBP;
            case '.ico':
                return Icon.TYPE_ICO;
            default:
                return Icon.TYPE_UNKNOWN;
        }
    }
    /**
     * @param string tag
     *
     * @return this
     */
    addTag(tag) {
        this.tags.push(tag);
        return this;
    }
    /**
     * @param string[] tags
     *
     * @return this
     */
    addTags(tags) {
        this.tags = this.tags.concat(tags);
        return this;
    }
    /**
     * @return string
     */
    tagsString() {
        return [...new Set(this.tags)].join(',');
    }
    /**
     * @throws InvalidTypeException
     * @throws DimensionsException
     */
    validate() {
        if (this.type === Icon.TYPE_UNKNOWN) {
            throw new InvalidTypeException('Unknown icon type');
        }
        if (this.type !== Icon.TYPE_SVG) {
            if (this.width === 0 || this.height === 0) {
                throw new DimensionsException('Dimensions cannot be 0');
            }
        }
    }
}
exports.Icon = Icon;
/*constructor(
private name: string,
private age: number,
private type: CharacterType
) {}*/
Icon.TYPE_UNKNOWN = -1;
Icon.TYPE_SVG = 0;
Icon.TYPE_PNG = 1;
Icon.TYPE_GIF = 2;
Icon.TYPE_PDF = 3;
Icon.TYPE_ICNS = 4;
Icon.TYPE_WEBP = 5;
Icon.TYPE_ICO = 6;
class IconGroup {
    /**
     * Group constructor.
     *
     * @param string           name
     * @param Array<IconGroup|IconSet> children
     */
    constructor(name = 'Untitled', children = []) {
        /**
         * @var Array<IconGroup|IconSet>
         */
        this.children = [];
        /**
         * @var undefined|string
         */
        this.name = null;
        /**
         * @var undefined|string
         */
        this.identifier = null;
        /**
         * @var undefined|string
         */
        this.description = '';
        /**
         * @var undefined|Group
         */
        this.group = null;
        /**
         * @var number
         */
        this.sort = 0;
        this.name = name;
        this.children = children;
        this.identifier = globallyUniqueIdentifier();
    }
    /**
     * @param Set set
     *
     * @return this
     */
    addSet(set) {
        set.group = this;
        this.children.push(set);
        return this;
    }
    /**
     * @param Group group
     *
     * @return this
     */
    addGroup(group) {
        group.group = this;
        this.children.push(group);
        return this;
    }
    /**
     * @return Array<Group|Set>
     */
    getChildren() {
        return this.children;
    }
}
exports.IconGroup = IconGroup;
class IconSet {
    /**
     * Set constructor.
     *
     * @param string name
     * @param Array<Icon>
     */
    constructor(name = 'Untitled Set', icons = []) {
        /**
         * @var Array<Icon>
         */
        this.icons = [];
        /**
         * @var undefined|string
         */
        this.name = undefined;
        /**
         * @var undefined|string
         */
        this.identifier = undefined;
        /**
         * @var undefined|string
         */
        this.description = '';
        /**
         * @var undefined|License
         */
        this.license = undefined;
        /**
         * @var undefined|Date
         */
        this.date = undefined;
        /**
         * @var undefined|Group
         */
        this.group = undefined;
        /**
         * @var number
         */
        this.sort = 0;
        this.name = name;
        this.icons = icons;
        this.identifier = globallyUniqueIdentifier();
    }
    /**
     * @param Icon icon
     *
     * @return this
     */
    addIcon(icon) {
        icon.set = this;
        this.icons[this.icons.length] = icon;
        return this;
    }
}
exports.IconSet = IconSet;
class License {
    /**
     * License constructor.
     *
     * @param string name
     */
    constructor(name = 'Untitled License') {
        /**
         * @var undefined|string
         */
        this.name = undefined;
        /**
         * @var undefined|string
         */
        this.url = undefined;
        /**
         * @var undefined|string
         */
        this.description = undefined;
        /**
         * @var undefined|string
         */
        this.identifier = undefined;
        this.name = name;
        this.identifier = globallyUniqueIdentifier();
    }
}
exports.License = License;
class CopyFileException extends Error {
    constructor(message) {
        console.error(message);
        super();
    }
}
exports.CopyFileException = CopyFileException;
class CreationException extends Error {
    constructor(message) {
        console.error(message);
        super();
    }
}
exports.CreationException = CreationException;
class DimensionsException extends Error {
    constructor(message) {
        console.error(message);
        super();
    }
}
exports.DimensionsException = DimensionsException;
class InvalidTypeException extends Error {
    constructor(message) {
        console.error(message);
        super();
    }
}
exports.InvalidTypeException = InvalidTypeException;
