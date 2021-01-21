main()

async function main(){

// Notes: ranged single shots only, no explosives, no shotgun shells, and no bow&crossbow. I am using legality.value to determine if something is broken (-1 is broken)

// Get Selected
let selected = canvas.tokens.controlled;
if(selected.length == 0 || selected.length > 1){
  ui.notifications.error("Please select your character")
  return;
}
let selected_actor = selected[0].actor;

// Get Target
let target = Array.from(game.user.targets)
if(target.length == 0 || target.length > 1 ){
  ui.notifications.error("Please target one enemy");
  return;
}
let target_actor = target[0].actor;

// Get Range
let position_you = canvas.tokens.controlled[0].position
let position_enemy = target[0].position
let xAxis = Math.abs(position_you.x - position_enemy.x)/50
let yAxis = Math.abs(position_you.y - position_enemy.y)/50
let range = Math.max(xAxis, yAxis)
if(range > 800){
  ui.notifications.error("They are too far away, choom!");
  return;
}

// Range related table [0-6m, 7-12m, 13-25m, 26-50m, 51-100m, 101-200m, 201-400m, 401-800m]
let pistolRangeTable = [13, 15, 20, 25, 30, 30, 1000, 1000]
let smgRangeTable = [15, 13, 15, 20, 25, 25, 30, 1000]
let slugRangeTable = [13, 15, 20, 25, 30, 35, 1000, 1000]
let arRangeTable = [17, 16, 15, 13, 15, 20, 25, 30]
let sniperRangeTable = [30, 25, 25, 20, 15, 16, 17, 20]


// Weapon Options
let actorWeapons = selected_actor.items.filter(item => item.data.data.ammo?.value > "0" && item.data.data.weapontype?.value != "bow" && item.data.data.weapontype?.value != "crossbow" && item.data.data.weapontype?.value != "rocketlauncher" && item.data.data.weapontype?.value != "grenadelauncher" && item.data.data.ammotype?.value != "shell" && item.data.data.legality?.value > -1)
let weaponOptions = ""
for(let item of actorWeapons){
  weaponOptions += `<option value=${item.id}>${item.data.name} | Ammo: ${item.data.data.ammo.value}${item.data.data.ammotype.value} | ROF: ${item.data.data.rof.value}</option>`
  }

// Aimed Shot types
let aimedOptions = [`<option value=0>Normal</option>`, `<option value=1>Head Shot</option>`, `<option value=2>Held Item</option>`, `<option value=3>Leg Shot</option>`]

// Get other character based modifiers
let sheetModifiers = selected_actor.data.data.modifiers.modfinalmod.totalpenalty
// Maybe add luck eventually

// Dialog Box  
let dialogTemplate = `
  <h1>They are ${range} meters away. Is there cover?</h1>
  <div style="display:flex">
    <div style="flex:1">Weapon: <select id="weapon">${weaponOptions}</select></div>
    <div style="flex:1">Aimed Shot: <select id="aimedShot">${aimedOptions}</select></div>
  </div>
  `
new Dialog({
    title: "Pew Pew Time",
    content: dialogTemplate,
    buttons: {
        rollAttack: {
            label: "Roll Attack",
            callback: (html) => {
              // Find html values
              let wepID = html.find("#weapon")[0].value;
              let chosenWeapon = selected_actor.items.find(item => item.id == wepID);
              let aimedValue = html.find("#aimedShot")[0].value;
              // Define the correct skill
              let chosenSkill = chosenWeapon.data.data.skill.value
              let sentence = "selected_actor.data.data.skills.replaceMe.value"
              let replacement = sentence.replace(/replaceMe/i, chosenSkill)
              let skillBonus = eval(replacement) //workaround this??
              // Pentalty for aimed shots
              if(aimedValue == 0){
                var aimedModifier = 0
              }else{var aimedModifier = -8}
              // Roll attack using all modifiers
              var attackRollString = `1dp + ${selected_actor.data.data.attributes.ref.value} +${skillBonus} +${aimedModifier} +${sheetModifiers}`
              let attackRoll = await new Roll(attackRollString).toMessage({
                speaker: {
                  alias: selected_actor.name
                }
              })
              // Roll initial damage
              let damageRollString = `${chosenWeapon.data.data.damage.value}`
              let damageRoll = new Roll(damageRollString)
              damageRoll.evaluate()
              console.log(damageRoll.result)
              console.log(damageRoll.total)
              // Defining the appropriate range table to be utalized
              let weaponType = chosenWeapon.data.data.weapontype.value
              if(weaponType == "mpistol" || weaponType == "hpistol" || weaponType == "vhpistol"){
                var rangeTable = pistolRangeTable
              }
              if(weaponType == "submachinegun" || weaponType == "hsubmachinegun"){
                var rangeTable = smgRangeTable
              }
              if(weaponType == "shotgun"){
                var rangeTable = slugRangeTable
              }
              if(weaponType == "assaultrifle"){
                var rangeTable = arRangeTable
              }
              if(weaponType == "sniperrifle"){
                var rangeTable = sniperRangeTable
              } 
              // Setting the DC to the appropraite spot in the range table 
              if(range < 7){
              var DC = rangeTable[0]
              }
              if(range > 6 && range < 13){
                var DC = rangeTable[1]
              }
              if(range > 12 && range < 26){
                var DC = rangeTable[2]
              }
              if(range > 25 && range < 51){
                var DC = rangeTable[3]
              }
              if(range > 50 && range < 101){
                var DC = rangeTable[4]
              }
              if(range > 100 && range < 201){
                var DC = rangeTable[5]
              }
              if(range > 200 && range < 401){
                var DC = rangeTable[6]
              }
              if(range > 400 && range < 801){
                var DC = rangeTable[7]
              }
              //if attack is greater than DC
              if(attackRoll.total > DC){
                var chatTemplateAttack = `
                <p> Rolled: </p>
                `
                //Roll damage
                ////Subtract that result from coverHP to find postCoverDamage
                ////If result > 0, 
                  //Find the type of armor and it's sp
                  //Calculate damage through armor to find passthroughDamage
                  //Lower the SP value of the correct armor (unless it is already at 0)
              } else {
                var chatTemplateAttack = `
                <p> ${attackRoll.result} </p>
                <p> Rolled: ${attackRoll.total} against a DC of ${DC} </p>
                <p> It was a miss! </p> 
                `
                }
              ChatMessage.create({
                speaker: {
                  alias: selected_actor.name
                },
                content: chatTemplateAttack
              })  
              //Decrease the ammount of ammo in the clip 
              

              }
        },
        close: {
            label: "Close"
        }
    }
}).render(true);

}
