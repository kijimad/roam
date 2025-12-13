// セグメント数を計算
export function calculateNumSegments(contentHeight, topPadding, segmentHeight) {
    return Math.ceil((contentHeight + topPadding) / segmentHeight);
}

// スペーサーの高さを計算
export function calculateSpacerHeight(numSegments, segmentHeight, segmentGap, windowHeight) {
    const lastSegmentOffset = (numSegments - 1) * (segmentHeight + segmentGap);
    return lastSegmentOffset + windowHeight;
}

// セグメント内のコンテンツ位置を計算
export function calculateContentPosition(segmentIndex, topPadding, segmentHeight) {
    return topPadding - segmentIndex * segmentHeight;
}
