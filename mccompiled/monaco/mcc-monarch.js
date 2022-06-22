const mccompiled = {
	operators: [ `<`, `>`, `{`, `}`, `=`, `(`, `)`, `+`, `-`, `*`, `/`, `%`, `!` ],
	selectors: [ `@e`, `@a`, `@s`, `@p` ],
	preprocessor: [ `$var`, `$inc`, `$dec`, `$add`, `$sub`, `$mul`, `$div`, `$mod`, `$pow`, `$swap`, `$if`, `$else`, `$repeat`, `$log`, `$macro`, `$include`, `$strfriendly`, `$strupper`, `$strlower`, `$sum`, `$median`, `$mean`, `$iterate`, `$get`, `$len`, `$json` ],
	commands: [ `mc`, `select`, `globalprint`, `print`, `define`, `init`, `if`, `else`, `give`, `tp`, `tphere`, `move`, `face`, `facehere`, `rotate`, `block`, `fill`, `scatter`, `replace`, `kill`, `remove`, `clear`, `globaltitle`, `title`, `globalactionbar`, `actionbar`, `say`, `halt`, `damage`, `effect`, `effecth`, `null`, `tag`, `limit`, `explode`, `feature`, `function`, `return`, `struct`, `for` ],
	literals: [ `true`, `false`, `&`, `~`, `^` ],
	types: [ `int`, `decimal`, `bool`, `time`, `struct` ],
	comparisons: [ `block`, `type`, `family`, `mode`, `near`, `inside`, `not`, `level`, `name`, `rotation x`, `rotation y`, `any`, `count`, `item`, `holding`, `offset`, `null`, `class`, `position`, `position x`, `position y`, `position z` ],
	options: [ `nulls`, `gametest`, `exploders`, `uninstall`, `identify`, `up`, `down`, `left`, `right`, `forward`, `backward`, `survival`, `creative`, `adventure`, `times`, `subtitle`, `destroy`, `replace`, `hollow`, `outline`, `keep`, `lockinventory`, `lockslot`, `canplaceon:`, `candestroy:`, `enchant:`, `name:`, `lore:`, `author:`, `title:`, `page:`, `dye:` ],
    tokenizer: {
        root: [
            [ /@?[a-zA-Z$][\w]*/, {
                cases: {
                    '@selectors': 'selectors',
                    '@preprocessor': 'preprocessor',
                    '@commands': 'commands',
                    '@literals': 'literals',
                    '@types': 'types',
                    '@comparisons': 'comparisons',
                    '@options': 'options'
                }
            }],
			
			{ include: '@handler' },
			
			[ /[<>{}=()+\-*/%!]+/, 'operators' ],
            [ /"(?:[^"\\]|\\.)*"/, 'strings' ],
            [ /\[.+\]/, 'selectors.properties' ],
            [ /!?(?:\.\.)?\d+(?:\.\.)?\.?\d*[hms]?/, 'numbers' ]
        ],
		comment: [
            [/[^\/*]+/, 'comment' ],
			[/\/\*/, 'comment', '@push' ],
			["\\*/", 'comment', '@pop'  ],
			[/[\/*]/, 'comment' ]
		],
		handler: [
			[/[ \t\r\n]+/, 'white' ],
			[/\/\*/, 'comment', '@comment' ],
			[/\/\/.*$/, 'comment' ],
		]
    }
}
const mcc_operators = [
	{
		word: `<`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `>`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `{`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `}`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `=`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `(`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `)`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `+`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `-`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `*`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `/`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `%`,
		docs: 'No documentation available for v1.04.'
	},
	{
		word: `!`,
		docs: 'No documentation available for v1.04.'
	},
]
const mcc_selectors = [
	{
		word: `@e`,
		docs: `References all entities in the world.`
	},
	{
		word: `@a`,
		docs: `References all players in the world.`
	},
	{
		word: `@s`,
		docs: `References the executing entity/player.`
	},
	{
		word: `@p`,
		docs: `References the nearest player.`
	},
]
const mcc_preprocessor = [
	{
		word: `$var`,
		docs: `Sets a preprocessor variable to the value(s) provided.`
	},
	{
		word: `$inc`,
		docs: `Increments the given preprocessor variable by one. If multiple values are held, they are all incremented.`
	},
	{
		word: `$dec`,
		docs: `Decrements the given preprocessor variable by one. If multiple values are held, they are all decremented.`
	},
	{
		word: `$add`,
		docs: `Adds two preprocessor variables/values together, changing only the first one. A += B`
	},
	{
		word: `$sub`,
		docs: `Subtracts two preprocessor variables/values from each other, changing only the first one. A -= B`
	},
	{
		word: `$mul`,
		docs: `Multiplies two preprocessor variables/values together, changing only the first one. A *= B`
	},
	{
		word: `$div`,
		docs: `Divides two preprocessor variables/values from each other, changing only the first one. A /= B`
	},
	{
		word: `$mod`,
		docs: `Divides two preprocessor variables/values from each other, setting only the first one to the remainder of the operation. A %= B`
	},
	{
		word: `$pow`,
		docs: `Exponentiates two preprocessor variables/values with each other, changing only the first one. A = A^B`
	},
	{
		word: `$swap`,
		docs: `Swaps the values of two preprocessor variables`
	},
	{
		word: `$if`,
		docs: `Compares a preprocessor variable and another value/variable. If the source variable contains multiple values, they all must match the condition.`
	},
	{
		word: `$else`,
		docs: `Directly inverts the result of the last $if call at this level in scope.`
	},
	{
		word: `$repeat`,
		docs: `Repeats the following statement/block a number of times. If a variable identifier is given, that variable will be set to the index of the current iteration. 0, 1, 2, etc.`
	},
	{
		word: `$log`,
		docs: `Sends a message to stdout with a line terminator at the end.`
	},
	{
		word: `$macro`,
		docs: `If a block follows this call, it is treated as a definition. Arguments are passed in as preprocessor variables. If no block follows this call, it will attempt to run the macro with any inputs parameters copied to their respective preprocessor variables.`
	},
	{
		word: `$include`,
		docs: `Places the contents of the given file in replacement for this statement. Not intended for production use yet.`
	},
	{
		word: `$strfriendly`,
		docs: `Convert the given preprocessor variable value(s) to a string in 'Title Case'.`
	},
	{
		word: `$strupper`,
		docs: `Convert the given preprocessor variable value(s) to a string in 'UPPERCASE'.`
	},
	{
		word: `$strlower`,
		docs: `Convert the given preprocessor variable value(s) to a string in 'lowercase'.`
	},
	{
		word: `$sum`,
		docs: `Adds all values in the given preprocessor variable together into one value and stores it in a result variable.`
	},
	{
		word: `$median`,
		docs: `Gets the middle value/average of the two middle values and stores it in a result variable.`
	},
	{
		word: `$mean`,
		docs: `Averages all values in the given preprocessor variable together into one value and stores it in a result variable.`
	},
	{
		word: `$iterate`,
		docs: `Runs the following statement/block once for each value in the given preprocessor variable. The current iteration is held in the preprocessor variable given.`
	},
	{
		word: `$get`,
		docs: `Get the value at a specific 0-based index inside a preprocessor variable and store it in a result variable.`
	},
	{
		word: `$len`,
		docs: `Get the number of values inside a preprocessor variable and store it in a result variable.`
	},
	{
		word: `$json`,
		docs: `Load a JSON file (if not previously loaded) and retrieve a value from it, storing said value in a preprocessor variable.`
	},
]
const mcc_commands = [
	{
		word: `mc`,
		docs: `Places a plain command in the output file, used for when the language lacks a certain feature.`
	},
	{
		word: `select`,
		docs: `Selects an entity based off of a selector, "name:type", or name of any managed entity (e.g., a null). If a block follows this statement, only the code in that block will use the selection specified here before returning to the previous selector.`
	},
	{
		word: `globalprint`,
		docs: `Prints a chat message to all players in the game. Variables/selectors can be inserted using {curly braces}.`
	},
	{
		word: `print`,
		docs: `Prints a chat message to the selected player(s). Variables/selectors can be inserted using {curly braces}.`
	},
	{
		word: `define`,
		docs: `Defines a variable with a name and type, defaulting to int if unspecified. Can be assigned a value directly after defining.`
	},
	{
		word: `init`,
		docs: `Ensures the selected entities have a value for the given variable, defaulting to 0 if not. This ensures the selected entities function as intended all the time.`
	},
	{
		word: `if`,
		docs: `Allows comparison of variables, along with a huge collection of other criteria. Can be chained together by '&' symbols and inverted by the keyword 'not'. Only runs the proceeding statement/block for entities where the condition returns true.`
	},
	{
		word: `else`,
		docs: `Inverts the comparison given by the previous if-statement at this scope level.`
	},
	{
		word: `give`,
		docs: `Gives an item to the selected entities. Runs either a 'give' or 'structure load' depending on requirements. Utilizes builder fields.`
	},
	{
		word: `tp`,
		docs: `Teleports the currently selected entities to a specific position, selector, "name:type" of entity, or name of another managed entity (e.g., nulls).`
	},
	{
		word: `tphere`,
		docs: `Teleports an entity to the selected entity based off of a selector, "name:type" of entity, or name of another managed entity (e.g., nulls).`
	},
	{
		word: `move`,
		docs: `Moves the selected entities in a direction (LEFT, RIGHT, UP, DOWN, FORWARD, BACKWARD) for a certain amount. Simpler alternative for teleporting using caret offsets.`
	},
	{
		word: `face`,
		docs: `Faces the selected entities towards a specific position, selector, "name:type" of entity, or name of another managed entity (e.g., nulls).`
	},
	{
		word: `facehere`,
		docs: `Faces an entity based off of a selector, "name:type" of entity, or name of another managed entity (e.g., nulls) towards the selected entity.`
	},
	{
		word: `rotate`,
		docs: `Rotates the selected entities a certain number of degrees horizontally and vertically from their current rotation.`
	},
	{
		word: `block`,
		docs: `Places a block at a specific position, optionally using a replace mode.`
	},
	{
		word: `fill`,
		docs: `Fills blocks in a specific region, optionally using a replace mode.`
	},
	{
		word: `scatter`,
		docs: `Randomly scatters blocks throughout a region with a certain percentage.`
	},
	{
		word: `replace`,
		docs: `Replaces all source blocks with a result block in a specific region.`
	},
	{
		word: `kill`,
		docs: `Kills the selected entities, causing the death animation, sounds, and particles to appear.`
	},
	{
		word: `remove`,
		docs: `Teleports the selected entities deep into the void, causing a silent death.`
	},
	{
		word: `clear`,
		docs: `Clears the inventories of all selected entities, optionally searching for a specific item and limiting the number of items to remove.`
	},
	{
		word: `globaltitle`,
		docs: `Displays a title on the screen of all players in the game. Can also be used to set the timings of the title. Variables/selectors can be inserted using {curly braces}`
	},
	{
		word: `title`,
		docs: `Displays a title on the screen of the selected players. Can also be used to set the timings of the title. Variables/selectors can be inserted using {curly braces}`
	},
	{
		word: `globalactionbar`,
		docs: `Displays an actionbar on the screen of all players in the game. Can also be used to set the timings of the actionbar. Variables/selectors can be inserted using {curly braces}`
	},
	{
		word: `actionbar`,
		docs: `Displays an actionbar on the screen of the selected players. Can also be used to set the timings of the actionbar. Variables/selectors can be inserted using {curly braces}`
	},
	{
		word: `say`,
		docs: `Send a plain-text message as the selected entities. Plain selectors can be used, but not variables.`
	},
	{
		word: `halt`,
		docs: `Ends the execution of the code entirely by running out the function command limit.`
	},
	{
		word: `damage`,
		docs: `Damages the selected entities with a certain cause, optionally coming from a position or blaming an entity by a selector, "name:type" of entity, or name of another managed entity (e.g., nulls).`
	},
	{
		word: `effect`,
		docs: `Gives the selected entities a potion effect with visible particles. Time and amplifier can be specified to further customize the potion effect. All potion effects can be cleared using 'effect clear'.`
	},
	{
		word: `effecth`,
		docs: `Gives the selected entities a potion effect with no particles. Time and amplifier can be specified to further customize the potion effect. All potion effects can be cleared using 'effect clear'.`
	},
	{
		word: `null`,
		docs: `Create a null entity, remove the selected ones, or manage the classes on the selected ones.`
	},
	{
		word: `tag`,
		docs: `Adds, removes, or singles out a tag on the selected entities.`
	},
	{
		word: `limit`,
		docs: `Limits the number of entities that the following commands can target at once.`
	},
	{
		word: `explode`,
		docs: `Create an explosion at a specific position with optional positioning, power, delay, fire, and block breaking settings.`
	},
	{
		word: `feature`,
		docs: `Enables a feature to be used for this project, generating any of the necessary files.`
	},
	{
		word: `function`,
		docs: `If followed by a block, it is treated as a function definition. Parameters must have types, optionally having default values. Functions should be called through 'function_name(parameters)'.`
	},
	{
		word: `return`,
		docs: `Set the value that will be returned from this function when it ends. The caller can use this value however it wishes.`
	},
	{
		word: `struct`,
		docs: `Define a structure with a set of fields and optionally default values in the proceeding block. See documentation.`
	},
	{
		word: `for`,
		docs: `Runs the following statement or block once over every entity that is currently selected.`
	},
]
const mcc_literals = [
	{
		word: `true`,
		docs: `A boolean value representing true/yes.`
	},
	{
		word: `false`,
		docs: `A boolean value representing false/no.`
	},
	{
		word: `&`,
		docs: `Adds on another comparison.`
	},
	{
		word: `~`,
		docs: `Relative to executor's position.`
	},
	{
		word: `^`,
		docs: `Relative to executor's direction.`
	},
]
const mcc_types = [
	{
		word: `int`,
		docs: `An integer, representing any whole value between -2147483648 to 2147483647.`
	},
	{
		word: `decimal`,
		docs: `A decimal number with a pre-specified level of precision.`
	},
	{
		word: `bool`,
		docs: `A true or false value. Displayed as whatever is set in the '_true' and '_false' preprocessor variables respectively.`
	},
	{
		word: `time`,
		docs: `A value representing a number of ticks. Displayed as MM:SS.`
	},
	{
		word: `struct`,
		docs: `A user-defined structure of multiple variables.`
	},
]
const mcc_comparisons = [
	{
		word: `block`,
		docs: `Check for a block being present in the world.`
	},
	{
		word: `type`,
		docs: `Check for a specific entity type.`
	},
	{
		word: `family`,
		docs: `Check for a specific entity family.`
	},
	{
		word: `mode`,
		docs: `Check for the player(s) in a specific gamemode.`
	},
	{
		word: `near`,
		docs: `Check for entities being near a certain position. Relative coordinates are relative to the executing entity.`
	},
	{
		word: `inside`,
		docs: `Check for entities inside a rectangular prism. Relative coordinates are relative to the executing entity.`
	},
	{
		word: `not`,
		docs: `Invert the following condition.`
	},
	{
		word: `level`,
		docs: `Compare player(s) XP level.`
	},
	{
		word: `name`,
		docs: `Check for entities with a specific name.`
	},
	{
		word: `rotation x`,
		docs: `Compare entity X rotation.`
	},
	{
		word: `rotation y`,
		docs: `Compare entity Y rotation.`
	},
	{
		word: `any`,
		docs: `Check if any entity is matched by a selector.`
	},
	{
		word: `count`,
		docs: `Compare the number of entities that match a selector.`
	},
	{
		word: `item`,
		docs: `Check for players holding or containing a specific item/number of items in their inventory.`
	},
	{
		word: `holding`,
		docs: `Check for player(s) holding a specific item/nummber of items.`
	},
	{
		word: `offset`,
		docs: `Offset the execution of the next condition.`
	},
	{
		word: `null`,
		docs: `Check for entities which are nulls, optionally with a specific name.`
	},
	{
		word: `class`,
		docs: `Check for entities which are nulls and are under a specific class.`
	},
	{
		word: `position`,
		docs: `Check for entities at a specific x, y, z, position. Relative coordinates are relative to the executing entity.`
	},
	{
		word: `position x`,
		docs: `Compare entity X position. Relative coordinates are relative to the executing entity.`
	},
	{
		word: `position y`,
		docs: `Compare entity Y position. Relative coordinates are relative to the executing entity.`
	},
	{
		word: `position z`,
		docs: `Compare entity Z position. Relative coordinates are relative to the executing entity.`
	},
]
const mcc_options = [
	{
		word: `nulls`,
		docs: `Feature: Create null entity behavior/resource files and allow them to be spawned in the world.`
	},
	{
		word: `gametest`,
		docs: `Feature: Gametest Integration`
	},
	{
		word: `exploders`,
		docs: `Feature: Create exploder entity behavior/resource files and allow them to be created through the 'explode' command.`
	},
	{
		word: `uninstall`,
		docs: `Feature: Create an uninstall function to undo all effects of this project.`
	},
	{
		word: `identify`,
		docs: `Feature: Give each player a unique ID, allowing them to be identified by the 'id' variable (integer).`
	},
	{
		word: `up`,
		docs: `Used with the 'move' command. Goes up relative to where the entity is looking.`
	},
	{
		word: `down`,
		docs: `Used with the 'move' command. Goes down relative to where the entity is looking.`
	},
	{
		word: `left`,
		docs: `Used with the 'move' command. Goes left relative to where the entity is looking.`
	},
	{
		word: `right`,
		docs: `Used with the 'move' command. Goes right relative to where the entity is looking.`
	},
	{
		word: `forward`,
		docs: `Used with the 'move' command. Goes forward relative to where the entity is looking.`
	},
	{
		word: `backward`,
		docs: `Used with the 'move' command. Goes backward relative to where the entity is looking.`
	},
	{
		word: `survival`,
		docs: `Survival mode. (0)`
	},
	{
		word: `creative`,
		docs: `Creative mode. (1)`
	},
	{
		word: `adventure`,
		docs: `Adventure mode. (2)`
	},
	{
		word: `times`,
		docs: `Specifies the fade-in/stay/fade-out times this text will show for.`
	},
	{
		word: `subtitle`,
		docs: `Sets the subtitle for the next title shown.`
	},
	{
		word: `destroy`,
		docs: `Destroy any existing blocks as if broken by a player.`
	},
	{
		word: `replace`,
		docs: `Replace any existing blocks. Default option.`
	},
	{
		word: `hollow`,
		docs: `Hollow the area, only filling the outer edges with the block. To keep inside contents, use 'outline'.`
	},
	{
		word: `outline`,
		docs: `Outline the area, only filling the outer edges with the block. To remove inside contents, use 'hollow'.`
	},
	{
		word: `keep`,
		docs: `Keep any existing blocks, and only fill where air is present.`
	},
	{
		word: `lockinventory`,
		docs: `Lock the item in the player's inventory.`
	},
	{
		word: `lockslot`,
		docs: `Lock the item in the slot which it is placed in.`
	},
	{
		word: `canplaceon:`,
		docs: `Specifies a block the item can be placed on.`
	},
	{
		word: `candestroy:`,
		docs: `Specifies a block the item can destroy.`
	},
	{
		word: `enchant:`,
		docs: `Give a leveled enchantment to this item. No limits.`
	},
	{
		word: `name:`,
		docs: `Give the item a display name.`
	},
	{
		word: `lore:`,
		docs: `Give the item a line of lore. Multiple of these can be used to add more lines.`
	},
	{
		word: `author:`,
		docs: `If this item is a 'written_book', set the name of the author.`
	},
	{
		word: `title:`,
		docs: `If this item is a 'written_book', set its title.`
	},
	{
		word: `page:`,
		docs: `If this item is a 'written_book', add a page to it.  Multiple of these can be used to add more pages.`
	},
	{
		word: `dye:`,
		docs: `If this item is a piece of leather armor, set its color to an RGB value.`
	},
]
