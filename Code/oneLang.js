var oneLang = {
	add: (parent, ...arguments) => {

		let child = [];

		for(let i = 0; i < arguments.length; i++) {

			child = child.concat(
				Array.isArray(arguments[i]) ?
					arguments[i] :
					[arguments[i]]
			);
		}

		child.forEach((item) => {

			parent.children.push(item);

			item.parent = parent;
		});

		return parent;
	},
	clean: (element) => {
		
		return {
			content: element.content != null ? element.content : "",
			children: element.children != null ?
				element.children.map((item) => {
					return oneLang.clean(item);
				}) :
				[]
		};
	},
	clear: (source) => {

		let indent = oneLang.getIndent(source);
		let lines = source.split("\n");

		let inComment = false;

		for(let i = 0; i < lines.length; i++) {

			if(!inComment && lines[i].trim() == "-") {
				
				let length = oneLang.getElementLength(lines, indent, i);
				i += length != -1 ? length + 1 : 0;

				continue;
			}

			let line = "";

			let tokens = oneLang.escape(oneLang.tokenize([
				"#", "#[", "]#", "~", "\'", "\""
			], lines[i]));

			for(let j = 0; j < tokens.length; j++) {

				if(!inComment && tokens[j] == "#")
					break;

				if(!inComment && tokens[j] == "#[")
					inComment = true;

				else if(inComment && tokens[j] == "]#")
					inComment = false;
				
				else if(!inComment)
					line += tokens[j];
			}

			lines[i] = line.trim().length != 0 ? line : null;
		}

		return lines.filter(line => line != null).join("\n");
	},
	copy: (element) => {

		return oneLang.setValues(
			JSON.parse(JSON.stringify(oneLang.clean(element)))
		);
	},
	create: (content, parent, ...arguments) => {
	
		let children = [];
	
		for(let i = 0; i < arguments.length; i++) {
	
			children = children.concat(
				Array.isArray(arguments[i]) ?
					arguments[i] :
					[arguments[i]]
			);
		}
	
		return oneLang.setValues({
			content: content != null ? content : "",
			parent: parent,
			children: children
		});
	},
	escape: (line, check) => {

		line = oneLang.escapeTilde(line);

		let inSingleQuote = false;
		let inDoubleQuote = false;

		for(let i = 0; i < line.length - 1; i++) {

			let inQuote = inSingleQuote || inDoubleQuote;
		
			if(line[i] == "\'" && !inDoubleQuote)
				inSingleQuote = !inSingleQuote;
		
			if(line[i] == "\"" && !inSingleQuote)
				inDoubleQuote = !inDoubleQuote;

			if(inQuote || inSingleQuote || inDoubleQuote) {

				line[i] += line[i + 1];

				if(inSingleQuote && line[i + 1] == "\'")
					inSingleQuote = false;

				if(inDoubleQuote && line[i + 1] == "\"")
					inDoubleQuote = false;

				line.splice(i + 1, 1);
				i--;
			}
		}

		return check ? (inSingleQuote || inDoubleQuote) : line;
	},
	escapeTilde: (line) => {

		for(let i = 0; i < line.length - 1; i++) {
			
			if(line[i] == "~") {

				line[i] += line[i + 1];

				line.splice(i + 1, 1);
			}
		}

		return line;
	},
	fromList: (list) => {

		return {
			content: list.length > 0 ?
				(!Array.isArray(list[0]) ? list[0] : "") : "",
			children: list.slice(Array.isArray(list[0]) ? 0 : 1).map(
				item => Array.isArray(item) ?
					oneLang.fromList(item) : { content: item, children: [] }
			)
		}
	},
	getActiveElement: (element, nest) => {

		let current = element;
		
		for(let i = 0; i < nest; i++) {

			if(current.children.length > 0)
				current = current.children[current.children.length - 1];

			else
				break;
		}
		
		return current;
	},
	getElementContent: (lines, indent, index, length) => {

		let content = [];
		let cutoff = oneLang.getNest(lines[index], indent) * indent.length + 1;

		for(let i = index + 1; i < index + length + 1; i++) {

			if(lines[i].length < cutoff)
				content.push("");

			else
				content.push(lines[i].substring(cutoff));
		}

		return content.join("\n");
	},
	getElementLength: (lines, indent, index) => {

		let nest = oneLang.getNest(lines[index], indent);

		for(let i = index + 1; i < lines.length; i++) {

			if(lines[i].trim() != "") {

				let lineNest = oneLang.getNest(lines[i], indent);

				if(lines[i].trim() == "-" && nest == lineNest)
					return i - index - 1;

				else if(lineNest <= nest)
					return -1;
			}
		}

		return -1;
	},
	getIndent: (source) => {
		
		let sample = source.split("\n").filter(line =>
			line.trim().length > 0 && (
				line.startsWith(" ") ||
				line.startsWith("\t")
			)
		)[0];

		return sample != null ?
			sample.substring(0, sample.indexOf(sample.trim())) :
			"\t";
	},
	getNest: (line, indent) => {

		let count = 0;

		for(; count * indent.length < line.length; count++) {

			if(!line.substring(count * indent.length).startsWith(indent))
				break;
		}

		return count;
	},
	getToken: (tokens, string, index) => {
		
		let validTokens = [];

		for(let i = 0; i < tokens.length; i++) {

			let token = tokens[i];

			if(oneLang.isToken(token, string, index))
				validTokens.push(token);
		}

		if(validTokens.length == 0)
			return null;

		let validToken = validTokens[0];

		for(let i = 1; i < validTokens.length; i++) {
			
			if(validTokens[i].length > validToken.length)
				validToken = validTokens[i];
		}

		return validToken;
	},
	isToken: (token, string, index) => {

		if(string.length - index < token.length)
			return false;
		
		for(let i = index;
			i < string.length && i - index < token.length;
			i++) {

			if(string.charAt(i)!= token.charAt(i - index))
				return false;
		}

		return true;
	},
	read: (source, minus) => {

		if(minus)
			source = "[>" + source + "<]";

		let element = oneLang.create();

		let indent = oneLang.getIndent(source);
		source = oneLang.clear(source).split("\n");

		let baseElements = [element];

		for(let i = 0; i < source.length; i++) {

			let currentElement = element;
			let nest = oneLang.getNest(source[i], indent);

			if(nest < baseElements.length) {

				currentElement = baseElements[nest];

				baseElements.splice(nest + 1);
			}

			if(source[i].trim() == "-") {
				
				let length = oneLang.getElementLength(source, indent, i);
				
				if(length != -1) {

					let newElement =
						oneLang.create(oneLang.getElementContent(
							source, indent, i, length
						));
		
					oneLang.add(currentElement, newElement);

					currentElement = newElement;
					baseElements.push(currentElement);
		
					i += length + 1;
		
					continue;
				}
			}

			let separators = [",", ":", ";", "(", ")", "{", "}"];

			let initialTokens = oneLang.tokenize(
				separators.concat(["~", "\'", "\"", "[>", "<]"]),
				source[i]
			);

			let tokens = oneLang.escape(
				JSON.parse(JSON.stringify(initialTokens))
			).map((token) => {

				if(token == "~n")
					return "\n";

				if(token == "~t")
					return "\t";

				return token;
			});

			if(i < source.length - 1) {

				let inMinus = false;
		
				for(let j = 0; j < tokens.length; j++) {
		
					if(tokens[j] == "[>" && !inMinus)
						inMinus = true;
		
					else if(tokens[j] == "<]" && inMinus)
						inMinus = false;
				}
		
				if(inMinus) {
		
					let next = source[i + 1];

					let escaped = oneLang.escape(initialTokens, true);
		
					while(next.startsWith(nest))
						next = next.substring(nest.length);
		
					source[i] += (escaped ? "~n" : ",") + next;
					source.splice(i + 1, 1);
		
					i--;
		
					continue;
				}
			}

			let parenStack = [];
			let curlyStack = [];

			let root = oneLang.create();
			let content = null;

			nest = 0;

			for(let j = 0; j < tokens.length; j++) {

				if(tokens[j].trim().length == 0 ||
					tokens[j] == "[>" || tokens[j] == "<]") {
						
					continue;
				}

				let active = oneLang.getActiveElement(root, nest);

				if(!separators.includes(tokens[j])) {

					let token = tokens[j].trim();

					token = token.startsWith("~") ?
						token.substring(1) :
						token;
				
					if(token.startsWith("\'") || token.startsWith("\"")) {

						token = oneLang.escapeTilde(
							oneLang.tokenize(["~"], token)
						).map(
							(item) => {

								if(item.startsWith("~")) {
													
									if(item.startsWith("~n"))
										return "\n" + item.substring(2);

									if(item.startsWith("~t"))
										return "\t" + item.substring(2);

									return item.substring(1);
								}

								return item;
							}
						).join("");
					}
				
					if(token.startsWith("\'")) {
		
						if(token.length > 1)
							token = token.substring(1, token.length - 1);
					}

					if(content == null) {
						
						content = oneLang.create(token);

						oneLang.add(active, content);
					}

					else
						content.content += token;
				}

				else
					content = null;
				
				if(tokens[j] == ":" || tokens[j] == "{")
					nest++;

				if(tokens[j] == ";")
					nest--;

				if(tokens[j] == "(")
					parenStack.push(nest);

				if(tokens[j] == "{")
					curlyStack.push(nest - 1);

				if(tokens[j] == ")" && parenStack.length > 0)
					nest = parenStack.pop();

				if(tokens[j] == "}" && curlyStack.length > 0)
					nest = curlyStack.pop();

				if(nest < 0)
					nest = 0;
			}

			if(root.children.length > 0) {
		
				baseElements.push(oneLang.getActiveElement(
					root.children[root.children.length - 1],
					nest
				));

				root.children.forEach((item) => {
					oneLang.add(currentElement, item);
				});
			}
		}

		return oneLang.clean(element);
	},
	setValues: (element) => {

		element.content = element.content != null ? element.content : "";
		element.parent = element.parent != null ? element.parent : null;
		
		element.children.forEach((item) => {

			item.parent = element;

			oneLang.setValues(item);
		});

		return element;
	},
	toList: (element) => {

		let list = [element.content].concat(
			element.children.map(
				child => child.children.length == 0 ?
					child.content : oneLang.toList(child)
			)
		);

		return list[0] == "" && Array.isArray(list[1]) ? list.slice(1) : list;
	},
	tokenize: (tokens, string) => {

		let tokenize = [];

		let undefined = "";

		for(let i = 0; i < string.length; i++) {

			let token = oneLang.getToken(tokens, string, i);

			if(token == null)
				undefined += string.charAt(i);

			else {

				if(undefined.length > 0) {

					tokenize.push(undefined);

					undefined = "";
				}

				tokenize.push(token);

				i += token.length - 1;
			}
		}

		if(undefined.length > 0)
			tokenize.push(undefined);

		return tokenize;
	},
	unwrap: (element) => {

		element.content = oneLang.unwrapText(element.content);

		element.children.forEach(child => {
			oneLang.unwrap(child);
		});

		return element;
	},
	unwrapText: (string) => {

		string = string.split("\n\n");

		for(let i = 0; i < string.length; i++)
			string[i] = string[i].split("\n").join(" ");

		return string.join("\n\n");
	},
	wrap: (element, limit, tabWidth, nest) => {

		if(nest == null) {

			oneLang.unwrap(element);
			
			limit++;
		}

		nest = nest != null ? nest : 1;
		tabWidth = tabWidth != null ? tabWidth : 4;

		element.content = oneLang.wrapText(
			element.content,
			(limit + (tabWidth - 1)) - (nest * tabWidth)
		).split(" \n").join("\n");

		element.children.forEach(child => {
			oneLang.wrap(child, limit, tabWidth, nest + 1);
		});

		return element;
	},
	wrapText: (string, width) => {

		return string.replace(
			new RegExp(`(?![^\\n]{1,${width}}$)([^\\n]{1,${width}})\\s`, 'g'),
			'$1\n'
		);
	},
	write: (element, tokens, reduced) => {
	
		element = element.parent == null ?
			element :
			{ content: "", children: [oneLang.copy(element)] };
	
		tokens = tokens != null ? tokens : ["-", "\n", "\t"];
	
		try {
		
			let write = element;
			
			if(element.content != "") {
				
				write = oneLang.create();
				
				oneLang.add(write, oneLang.copy(element));
			}
			
			return oneLang.writeElement(tokens, write, 0, true, reduced);
		}
		
		catch(error) {
			return "";
		}
	},
	writeElement: (tokens, element, nest, isRoot, reduced) => {

		let code = "";
		
		if(!isRoot) {
			
			let content = element.content;
			
			code +=
				oneLang.writeIndent(nest, tokens[2]) +
				(!reduced ? tokens[0] : "") +
				tokens[1] +
				oneLang.writeIndent(nest + 1, tokens[2]);
			
			lines = content.split(tokens[1]);
			
			for(let i = 0; i < lines.length; i++) {
			
				code += lines[i];
				
				if(i < lines.length - 1) {

					code +=
						tokens[1] + oneLang.writeIndent(nest + 1, tokens[2]);
				}
			}
			
			code +=
				tokens[1] +
				oneLang.writeIndent(nest, tokens[2]) +
				(!reduced ? tokens[0] : "");
		}
		
		let elements = element.children;
		
		for(let i = 0; i < elements.length; i++) {
			
			if(!isRoot || i > 0)
				code += tokens[1];
			
			code += oneLang.writeElement(
				tokens,
				elements[i],
				(!isRoot ? nest + 1 : nest),
				false,
				reduced
			);
		}
		
		return code;
	},
	writeIndent: (nest, token) => {
		
		let indent = "";
		
		for(let i = 0; i < nest; i++)
			indent += token;
		
		return indent;
	}
};

if(typeof module == "object")
	module.exports = oneLang;