class Contributor {
  name;
  skillsNb;
  skills;

  constructor(name, skillsNb) {
    this.name = name;
    this.skillsNb = skillsNb;
    this.skills = []
  }

  canUseSkill(skill) {
    let bool = false;
    this.skills.map(sk => {
      if (sk.name === skill.name && sk.level >= skill.level) {
        bool = true;
      }
    })
    return bool;
  }
}

export default Contributor