import appContext from "../components/app_context.js";
import treeService from "./tree.js";
import dialogService from "./dialog.js";
import froca from "./froca.js";

function getHoistedNoteId() {
    const activeNoteContext = appContext.tabManager.getActiveContext();

    return activeNoteContext ? activeNoteContext.hoistedNoteId : 'root';
}

async function unhoist() {
    const activeNoteContext = appContext.tabManager.getActiveContext();

    if (activeNoteContext) {
        await activeNoteContext.unhoist();
    }
}

function isTopLevelNode(node) {
    return isHoistedNode(node.getParent());
}

function isHoistedNode(node) {
    // even though check for 'root' should not be necessary, we keep it just in case
    return node.data.noteId === "root"
        || node.data.noteId === getHoistedNoteId();
}

async function isHoistedInHiddenSubtree() {
    const hoistedNoteId = getHoistedNoteId();

    if (hoistedNoteId === 'root') {
        return false;
    }

    const hoistedNote = await froca.getNote(hoistedNoteId);
    const hoistedNotePath = treeService.getSomeNotePath(hoistedNote);

    return treeService.isNotePathInHiddenSubtree(hoistedNotePath);
}

async function checkNoteAccess(notePath, noteContext) {
    const resolvedNotePath = await treeService.resolveNotePath(notePath, noteContext.hoistedNoteId);

    if (!resolvedNotePath) {
        console.log(`Cannot activate ${notePath}`);
        return false;
    }

    const hoistedNoteId = noteContext.hoistedNoteId;

    if (!resolvedNotePath.includes(hoistedNoteId) && !resolvedNotePath.includes('_hidden')) {
        if (!await dialogService.confirm("Requested note is outside of hoisted note subtree and you must unhoist to access the note. Do you want to proceed with unhoisting?")) {
            return false;
        }

        // unhoist so we can activate the note
        await unhoist();
    }

    return true;
}

export default {
    getHoistedNoteId,
    unhoist,
    isTopLevelNode,
    isHoistedNode,
    checkNoteAccess,
    isHoistedInHiddenSubtree
}
