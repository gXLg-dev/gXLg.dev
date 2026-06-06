window.onload = async () => {
  const langsButton = document.getElementById("langs-button");
  const langsDropdown = document.getElementById("langs-dropdown");
  const dropdownClasses = langsDropdown.classList;

  document.body.onclick = event => {
    let { target } = event;
    do {
      if (target == langsButton) {
        dropdownClasses.toggle("hidden");
        event.preventDefault();
        return;
      }
    } while (target = target.parentElement);
    dropdownClasses.add("hidden");
  };
};
