module.exports = async (html, req, res) => {
  const micons = html("[micon]");
  for (let i = 0; i < micons.length; i++) {
    const icon = micons.eq(i);
    const name = icon.attr("micon");
    icon.attr("micon", null);
    icon.prepend(`<i class="material-symbols-outlined micon" style="--content: '${name}'"></i>`);
  }

  const dicons = html("[dicon]");
  for (let i = 0; i < dicons.length; i++) {
    const icon = dicons.eq(i);
    const name = icon.attr("dicon");
    icon.attr("dicon", null);
    icon.prepend(`<i class="devicon-${name} dicon"</i>`);
  }

  const ricons = html("[ricon]");
  for (let i = 0; i < ricons.length; i++) {
    const icon = ricons.eq(i);
    const name = icon.attr("ricon");
    icon.attr("ricon", null);
    icon.prepend(`<i class="ri-${name} ricon"</i>`);
  }
};
