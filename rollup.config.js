import vue from 'rollup-plugin-vue';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';

const fs = require('fs-extra');
const path = require('path');

let entries = [];

let core = {};

let coreDependencies = {
    'primevueBeak/utils': 'primevueBeak.utils',
    'primevueBeak/api': 'primevueBeak.api',
    'primevueBeak/config': 'primevueBeak.config',
    'primevueBeak/ripple': 'primevueBeak.ripple',
    'primevueBeak/tooltip': 'primevueBeak.tooltip',
    'primevueBeak/virtualscroller': 'primevueBeak.virtualscroller',
    'primevueBeak/confirmationeventbus': 'primevueBeak.confirmationeventbus',
    'primevueBeak/toasteventbus': 'primevueBeak.toasteventbus',
    'primevueBeak/overlayeventbus': 'primevueBeak.overlayeventbus',
    'primevueBeak/terminalservice': 'primevueBeak.terminalservice',
    'primevueBeak/useconfirm': 'primevueBeak.useconfirm',
    'primevueBeak/usetoast': 'primevueBeak.usetoast',
    'primevueBeak/button': 'primevueBeak.button',
    'primevueBeak/inputtext': 'primevueBeak.inputtext',
    'primevueBeak/inputnumber': 'primevueBeak.inputnumber',
    'primevueBeak/message': 'primevueBeak.message',
    'primevueBeak/progressbar': 'primevueBeak.progressbar',
    'primevueBeak/dropdown': 'primevueBeak.dropdown',
    'primevueBeak/dialog': 'primevueBeak.dialog',
    'primevueBeak/paginator': 'primevueBeak.paginator',
    'primevueBeak/tree': 'primevueBeak.tree',
    'primevueBeak/menu': 'primevueBeak.menu',
    'primevueBeak/tieredmenu': 'primevueBeak.tieredmenu'
}

let globalDependencies = {
    'vue': 'Vue',
    '@fullcalendar/core': 'FullCalendar',
    ...coreDependencies
}

function addEntry(folder, inFile, outFile) {
    let useCorePlugin = Object.keys(coreDependencies).some(d => d.replace('primevueBeak/', '') === outFile);

    entries.push({
        input: 'src/components/' + folder + '/' + inFile,
        output: [
            {
                format: 'cjs',
                file: 'dist/' + folder + '/' + outFile + '.cjs.js',
            },
            {
                format: 'esm',
                file: 'dist/' + folder + '/' + outFile + '.esm.js'
            },
            {
                format: 'iife',
                name: 'primevueBeak.' + folder,
                file: 'dist/' + folder + '/' + outFile + '.js',
                globals: globalDependencies
            }
        ],
        plugins: [
            vue(),
            postcss(),
            useCorePlugin && corePlugin()
        ]
    });

    entries.push({
        input: 'src/components/' + folder + '/' + inFile,
        output: [
            {
                format: 'cjs',
                file: 'dist/' + folder + '/' + outFile + '.cjs.min.js'
            },
            {
                format: 'esm',
                file: 'dist/' + folder + '/' + outFile + '.esm.min.js'
            },
            {
                format: 'iife',
                name: 'primevueBeak.' + folder,
                file: 'dist/' + folder + '/' + outFile + '.min.js',
                globals: globalDependencies
            }
        ],
        plugins: [
            vue(),
            postcss(),
            terser(),
            useCorePlugin && corePlugin()
        ]
    });
}

function corePlugin() {
    return {
        name: 'corePlugin',
        generateBundle(outputOptions, bundle) {
            if (outputOptions.format === 'iife') {
                Object.keys(bundle).forEach(id => {
                    const chunk = bundle[id];
                    const name = id.replace('.min.js', '').replace('.js', '');
                    const filePath = `./dist/core/core${id.indexOf('.min.js') > 0 ? '.min.js': '.js'}`;

                    core[filePath] ? (core[filePath][name] = chunk.code) : (core[filePath] = { [`${name}`]: chunk.code });
                });
            }
        }
    };
}

function addCore() {
    const lastEntry = entries[entries.length - 1];

    lastEntry.plugins = [
        ...lastEntry.plugins,
        {
            name: 'coreMergePlugin',
            generateBundle() {
                Object.entries(core).forEach(([filePath, value]) => {
                    const code = Object.keys(coreDependencies).reduce((val, d) => {
                        const name = d.replace('primevueBeak/', '');
                        val += value[name] + '\n';

                        return val;
                    }, '');

                    fs.outputFile(path.resolve(__dirname, filePath), code, {}, function(err) {
                        if (err) {
                            return console.error(err);
                        }
                    });
                });
            }
        }
    ]
}

function addSFC() {
    fs.readdirSync(path.resolve(__dirname, './src/components/'), { withFileTypes: true })
        .filter(dir => dir.isDirectory())
        .forEach(({ name: folderName }) => {
            fs.readdirSync(path.resolve(__dirname, './src/components/' + folderName)).forEach(file => {
                let name = file.split(/(.vue)$|(.js)$/)[0].toLowerCase();
                if (/\.vue$/.test(file) && (name === folderName)) {
                    addEntry(folderName, file, name);
                }
            });
        });
}

function addDirectives() {
    addEntry('badgedirective', 'BadgeDirective.js', 'badgedirective');
    addEntry('ripple', 'Ripple.js', 'ripple');
    addEntry('tooltip', 'Tooltip.js', 'tooltip');
    addEntry('styleclass', 'StyleClass.js', 'styleclass');
}

function addConfig() {
    addEntry('config', 'primevueBeak.js', 'config');
}

function addUtils() {
    addEntry('utils', 'Utils.js', 'utils');
}

function addApi() {
    addEntry('api', 'Api.js', 'api');
}

function addServices() {
    addEntry('confirmationservice', 'ConfirmationService.js', 'confirmationservice');
    addEntry('confirmationeventbus', 'ConfirmationEventBus.js', 'confirmationeventbus');
    addEntry('useconfirm', 'UseConfirm.js', 'useconfirm');
    addEntry('toastservice', 'ToastService.js', 'toastservice');
    addEntry('toasteventbus', 'ToastEventBus.js', 'toasteventbus');
    addEntry('overlayeventbus', 'OverlayEventBus.js', 'overlayeventbus');
    addEntry('usetoast', 'UseToast.js', 'usetoast');
    addEntry('terminalservice', 'TerminalService.js', 'terminalservice');
}

addUtils();
addApi();
addConfig();
addDirectives();
addServices();
addSFC();
addCore();

export default entries;
