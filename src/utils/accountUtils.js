// src/utils/accountUtils.js
export const flattenAccountHierarchyOptions = (nodes, level = 0) => {
    if (!Array.isArray(nodes)) return [];

    const indent = "  ".repeat(level);
    return nodes.flatMap((node) => {
        const id = Number(node?.accountId || node?.id || 0);
        const name = String(
            node?.accountName || node?.value || node?.name || node?.accountCode || id,
        );
        const current = id > 0 ? [{ id, value: `${indent}${name}` }] : [];
        const children = flattenAccountHierarchyOptions(node?.children || [], level + 1);
        return [...current, ...children];
    });
};