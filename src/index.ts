import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';


/**
 * @return string
 */
function globallyUniqueIdentifier() {
    return randomUUID().toUpperCase();
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
function formattedDateString(time: Date = new Date()) {
    return time.toLocaleString('sv-SE');
}

/**
 * @param filename
 * @param baseDirectory
 *
 * @return string
 */
function uniqueFilename(filename: string, baseDirectory: string) {
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
function cleanString(string: string) {
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

export default class IconJar {
    private readonly EXT = 'iconjar';
    private readonly VERSION = 2.0;

    private readonly GZ_COMPRESSION_LEVEL = 1;

    /**
     * @var undefined|string
     */
    public name: undefined | string = undefined;

    /**
     * @var Array<IconGroup|IconSet>
     */
    protected children: Array<IconGroup | IconSet> = [];

    /**
     * @var array
     */
    protected groups = {};

    /**
     * @var array
     */
    protected sets = {};

    /**
     * @var array
     */
    protected icons = {};

    /**
     * @var array
     */
    protected licenses = {};

    /**
     * @var undefined|string
     */
    protected saveLocation: undefined | string = undefined;

    /**
     * IconJar constructor.
     *
     * @param                          name
     * @param Array<IconGroup|IconSet> children
     */
    public constructor(
        name: string,
        children: Array<IconGroup | IconSet> = []
    ) {
        this.name = name;
        this.children = children;
    }

    /**
     * @param IconSet set
     *
     * @return this
     */

    public addSet(set: IconSet) {
        this.children[this.children.length] = set;
        return this;
    }

    /**
     * @param IconGroup group
     *
     * @return this
     */
    public addGroup(group: IconGroup) {
        this.children[this.children.length] = group;
        return this;
    }

    /**
     * @param IconGroup|IconSet object
     */
    protected isGroup(object: IconGroup | IconSet): object is IconGroup {
        return (object as IconGroup).addSet !== undefined;
    }

    /**
     * @param IconGroup|IconSet object
     */
    protected isSet(object: IconGroup | IconSet): object is IconSet {
        return (object as IconSet).icons !== undefined;
    }

    /**
     * @param array children
     */
    protected compileArray(children: Array<IconGroup | IconSet>) {
        children.forEach((child) => {
            if (this.isSet(child)) {
                this.compileSet(child);
            } else if (this.isGroup(child)) {
                this.compileGroup(child);
            }
        });
    }

    protected compileSet(set: IconSet) {
        const dict = {
            name: set.name,
            identifier: set.identifier,
            sort: set.sort,
            description: set.description !== undefined ? set.description : '', // cannot be null,
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
    protected compileIcon(icon: Icon) {
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
            tags: icon.tagsString() !== undefined ? icon.tagsString() : '', // cannot be null,
            identifier: icon.identifier,
            parent: icon.set.identifier,
            unicode: icon.unicode !== undefined ? icon.unicode : '', // cannot be null
            description: icon.description !== undefined ? icon.description : '', // cannot be null
        };

        if (icon.license instanceof License) {
            dict['licence'] = this.compileLicense(icon.license);
        }
        this.icons[icon.identifier] = dict;
        try {
            fs.copyFileSync(icon.filePath, saveLocation + path.sep + filename);
        } catch (error) {
            throw new CopyFileException(error.message);
        }
        return icon.identifier;
    }

    /**
     * @param License license
     *
     * @return null|string
     */
    protected compileLicense(license: License) {
        if (
            this.licenses[license.identifier] === undefined ||
            this.licenses[license.identifier] === null
        ) {
            this.licenses[license.identifier] = {
                name: license.name,
                identifier: license.identifier,
                url: license.url,
                text:
                    license.description !== undefined
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
    protected compileGroup(group: IconGroup) {
        const dict = {
            name: group.name,
            identifier: group.identifier,
            sort: group.sort,
            description:
                group.description !== undefined ? group.description : '',
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
    public save(pathToSave) {
        const saveDir = pathToSave + path.sep + this.name + '.' + this.EXT;
        this.saveLocation = saveDir;
        try {
            fs.mkdirSync(saveDir);
        } catch (error) {
            throw new CreationException(error.message);
        }

        const iconDir = saveDir + path.sep + 'icons';
        try {
            fs.mkdirSync(iconDir);
        } catch (error) {
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
        } catch (error) {
            throw new CreationException(error.message);
        }

        return saveDir;
    }
}

export class Icon {
    /*constructor(
    private name: string,
    private age: number,
    private type: CharacterType
  ) {}*/

    static readonly TYPE_UNKNOWN = -1;
    static readonly TYPE_SVG = 0;
    static readonly TYPE_PNG = 1;
    static readonly TYPE_GIF = 2;
    static readonly TYPE_PDF = 3;
    static readonly TYPE_ICNS = 4;
    static readonly TYPE_WEBP = 5;
    static readonly TYPE_ICO = 6;

    /**
     * @var undefined|string
     */
    public filePath: undefined | string = undefined;

    /**
     * @var undefined|string
     */
    public file: undefined | string = undefined;

    /**
     * @var undefined|string
     */
    public name: undefined | string = undefined;

    /**
     * @var undefined|string
     */
    public identifier: undefined | string = null;

    /**
     * @var undefined|string
     */
    public description: undefined | string = '';

    /**
     * @var undefined|License
     */
    public license: undefined | License = null;

    /**
     * @var number
     */
    public type: number = Icon.TYPE_UNKNOWN;

    /**
     * @var string[]
     */
    public tags: string[] = [];

    /**
     * @var number
     */
    public width = 0;

    /**
     * @var number
     */
    public height = 0;

    /**
     * @var undefined|Date
     */
    public date: undefined | Date = undefined;

    /**
     * @var undefined|string
     */
    public unicode: undefined | string = undefined;

    /**
     * @var undefined|Set
     */
    public set: undefined | IconSet = undefined;

    /**
     * Icon constructor.
     *
     * @param string name
     * @param string fileOnDisk
     * @param number type
     */
    public constructor(
        name = 'Untitled Icon',
        fileOnDisk: string,
        type: number
    ) {
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
    public static getType(file) {
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
    public addTag(tag: string) {
        this.tags.push(tag);
        return this;
    }

    /**
     * @param string[] tags
     *
     * @return this
     */
    public addTags(tags: string[]) {
        this.tags = this.tags.concat(tags);
        return this;
    }

    /**
     * @return string
     */
    public tagsString() {
        return [...new Set(this.tags)].join(',');
    }

    /**
     * @throws InvalidTypeException
     * @throws DimensionsException
     */
    public validate() {
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

export class IconGroup {
    /**
     * @var Array<IconGroup|IconSet>
     */
    protected children: Array<IconGroup | IconSet> = [];

    /**
     * @var undefined|string
     */
    public name: undefined | string = null;

    /**
     * @var undefined|string
     */
    public identifier: undefined | string = null;

    /**
     * @var undefined|string
     */
    public description: undefined | string = '';

    /**
     * @var undefined|Group
     */
    public group: undefined | IconGroup = null;

    /**
     * @var number
     */
    public sort = 0;

    /**
     * Group constructor.
     *
     * @param string           name
     * @param Array<IconGroup|IconSet> children
     */
    public constructor(
        name = 'Untitled',
        children: Array<IconGroup | IconSet> = []
    ) {
        this.name = name;
        this.children = children;
        this.identifier = globallyUniqueIdentifier();
    }

    /**
     * @param Set set
     *
     * @return this
     */
    public addSet(set: IconSet) {
        set.group = this;
        this.children.push(set);
        return this;
    }

    /**
     * @param Group group
     *
     * @return this
     */
    public addGroup(group: IconGroup) {
        group.group = this;
        this.children.push(group);
        return this;
    }

    /**
     * @return Array<Group|Set>
     */
    public getChildren() {
        return this.children;
    }
}

export class IconSet {
    /**
     * @var Array<Icon>
     */
    public icons: Icon[] = [];

    /**
     * @var undefined|string
     */
    public name: undefined | string = undefined;

    /**
     * @var undefined|string
     */
    public identifier: undefined | string = undefined;

    /**
     * @var undefined|string
     */
    public description: undefined | string = '';

    /**
     * @var undefined|License
     */
    public license: undefined | License = undefined;

    /**
     * @var undefined|Date
     */
    public date: undefined | Date = undefined;

    /**
     * @var undefined|Group
     */
    public group: undefined | IconGroup = undefined;

    /**
     * @var number
     */
    public sort = 0;

    /**
     * Set constructor.
     *
     * @param string name
     * @param Array<Icon>
     */
    public constructor(name = 'Untitled Set', icons: Array<Icon> = []) {
        this.name = name;
        this.icons = icons;
        this.identifier = globallyUniqueIdentifier();
    }

    /**
     * @param Icon icon
     *
     * @return this
     */
    public addIcon(icon: Icon) {
        icon.set = this;
        this.icons[this.icons.length] = icon;
        return this;
    }
}

export class License {
    /**
     * @var undefined|string
     */
    public name: undefined | string = undefined;

    /**
     * @var undefined|string
     */
    public url: undefined | string = undefined;

    /**
     * @var undefined|string
     */
    public description: undefined | string = undefined;

    /**
     * @var undefined|string
     */
    public identifier: undefined | string = undefined;

    /**
     * License constructor.
     *
     * @param string name
     */

    public constructor(name = 'Untitled License') {
        this.name = name;
        this.identifier = globallyUniqueIdentifier();
    }
}

export class CopyFileException extends Error {
    public constructor(message?: string) {
        console.error(message);
        super();
    }
}

export class CreationException extends Error {
    public constructor(message?: string) {
        console.error(message);
        super();
    }
}

export class DimensionsException extends Error {
    public constructor(message?: string) {
        console.error(message);
        super();
    }
}

export class InvalidTypeException extends Error {
    public constructor(message?: string) {
        console.error(message);
        super();
    }
}
