import fs from "fs";
import es from "event-stream";
import Contributor from "./Contributor.js";
import Project from "./Project.js";
import Skill from "./Skill.js";

let contributors = [];
let projects = [];
let nbProjects = null;
let nbContributors = null;
let nbUsers = 0;
let nbNeededSkillsProject = 0;
let nbNeededSkillsUser = 0;
let ProjectsNotDone = [];
let userBusy = []
let projectsOnCours = []

let allSkills = {};

let stringsToWrite = [];

let file = fs
  .createReadStream("./input_data/c_collaboration.in.txt")
  .pipe(es.split())
  .pipe(
    es.mapSync(function (line) {
      file.pause();

      let lineElems = line.split(" ");
      if (nbProjects === null && nbContributors === null) {
        nbContributors = parseInt(lineElems[0]);
        nbProjects = parseInt(lineElems[1]);
      } else {
        if (nbUsers < nbContributors || nbNeededSkillsUser > 0) {
          if (nbNeededSkillsUser === 0) {
            let user = new Contributor(lineElems[0], lineElems[1]);
            contributors.push(user);
            nbNeededSkillsUser = parseInt(lineElems[1])
            nbUsers++;
          } else {
            let skill = new Skill(lineElems[0], lineElems[1]);
            contributors[contributors.length - 1].skills.push(
              skill
            );
            nbNeededSkillsUser = nbNeededSkillsUser - 1;
            if (allSkills[lineElems[0]]) {
              let currentSkill = allSkills[lineElems[0]];
              allSkills[lineElems[0]] = {
                min:
                  currentSkill.min > parseInt(lineElems[1])
                    ? parseInt(lineElems[1])
                    : currentSkill.min,
                nb: currentSkill.nb + 1,
              };
            } else {
              allSkills[lineElems[0]] = {
                min: lineElems[1],
                nb: 1,
              };
            }
          }
        } else {
          if (nbNeededSkillsProject === 0) {
            let project = new Project(
              lineElems[0],
              lineElems[1],
              lineElems[2],
              lineElems[3],
              lineElems[4]
            );
            projects.push(project);
            nbNeededSkillsProject = parseInt(lineElems[4]);
          } else {
            let skill = new Skill(lineElems[0], lineElems[1]);
            projects[projects.length - 1].skills.push(skill);
            nbNeededSkillsProject = nbNeededSkillsProject - 1;
          }
        }
      }

      file.resume();
    })
  )
  .on("error", () => {
    console.log("error");
  })
  .on("end", () => {
    console.log("end");
    run()
  });

// const getStartIndexToRemove = (indexP) => {
//   let sum = 0;
//   for (let i = 0; i < indexP; i++) {
//     sum += projectsOnCours[i].project.skills.length
//   }
//   return sum;
// }

const writeToFile = (allPlanedProjects) => {
  let writer = fs.createWriteStream('test.txt', {
    flags: 'a'
  })

  writer.write(allPlanedProjects + "\n");
  stringsToWrite.map(st => {
    writer.write(st)
  })
  writer.end();
}

const run = () => {

  projects.sort(compare);
  let bool = true;
  let currentDay = 0;
  let allPlanedProjects = 0;

  while (bool) {
    bool = false;

    //console.log(projectsOnCours);
    console.log(currentDay)
    projectsOnCours = projectsOnCours.filter((pj, index) => {
      if (pj.day + pj.project.daysToComplete == currentDay) {

        let freeUsers = []
        userBusy = userBusy.filter(user => {
          if (user.project.name === pj.project.name) {
            freeUsers.push(user.user)
            return false
          }
          return true
        })
        //let freeUsers = userBusy.splice(getStartIndexToRemove(index), pj.project.skills.length)
        stringsToWrite.push(pj.project.name + "\n");

        freeUsers.map((user, idx) => {
          let projectSkill = pj.project.skills[idx]
          user.skills = user.skills.map(sk => {
            if (sk.name === projectSkill.name && sk.level <= projectSkill.level) {
              let newSkill = sk;
              newSkill.level += 1;
              return newSkill
            }
            return sk
          })
          if (idx != freeUsers.length - 1) {
            stringsToWrite.push(user.name + " ")
          } else {
            stringsToWrite.push(user.name + "\n")
          }

          contributors.push(user)
        })

        return false;
      }
      return true
    })

    if (projectsOnCours.length !== 0) bool = true


    ProjectsNotDone = ProjectsNotDone.filter(pj => {
      if (canStartProject(pj)) {
        bool = true
        projects.push(pj)
        return false
      }
      return true
    })

    let canContinue = true;

    while (canContinue) {
      canContinue = false;

      for (let i = 0; i < projects.length; i++) {

        if (canStartProject(projects[i])) {
          let proj = projects.splice(i, 1)
          projectsOnCours.push({ project: proj[0], day: currentDay })
          bool = true;
          allPlanedProjects += 1;
          canContinue = true;
          break;
        } else {
          let proj = projects.splice(i, 1)
          ProjectsNotDone.push(proj[0])
          canContinue = true;
          break;
        }
      }
    }


    currentDay += 1

  }
  writeToFile(allPlanedProjects)
}

const canStartProject = (project) => {
  let indexesToRemove = [];
  let contributorsToRemove = []
  project.skills.map(skill => {
    for (let i = 0; i < contributors.length; i++) {
      if (indexesToRemove.indexOf(i) === -1 && contributors[i].canUseSkill(skill)) {
        contributorsToRemove.push(contributors[i])
        indexesToRemove.push(i);
        break;
      }
    }
  })

  if (indexesToRemove.length === project.skills.length) {
    contributors = contributors.filter((contrib, idx) => {
      return !indexesToRemove.includes(idx)
    })

    contributorsToRemove.map(user => {
      userBusy.push({ user, project })
    })
  }

  return indexesToRemove.length === project.skills.length
}

const compare = (pj1, pj2) => {
  let heurstique1 = pj1.getHeuristique(allSkills)
  let heurstique2 = pj2.getHeuristique(allSkills)

  return heurstique1 - heurstique2
}