function toggle(id) {
    var expandable = document.getElementById(id);
    if (expandable.style.display === 'block') {
        expandable.style.display = 'none';
    } else {
        expandable.style.display = 'block';
    }
};
