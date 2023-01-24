class Project {
  name;
  daysToComplete;
  score;
  bestBefore;
  nbRoles;
  skills;

  constructor(name, daysToComplete, score, bestBefore, nbRoles) {
    this.name = name;
    this.daysToComplete = parseInt(daysToComplete);
    this.score = parseInt(score);
    this.bestBefore = parseInt(bestBefore);
    this.nbRoles = parseInt(nbRoles);
    this.skills = []
  }

  getHeuristique(hashmap) {
    (this.score * (this.bestBefore - this.daysToComplete)) / (this.nbRoles - this.getSkillHeur(hashmap))
  }

  getSkillHeur(hashmap) {
    let sc;
    this.skills.map(skill => {
      if (hashmap[skill]) {
        let res = skill.level - hashmap[skill].min + hashmap[skill].nb
        sc = Math.max(sc, res)
      }
    })
    return sc;
  }
}


export default Project;