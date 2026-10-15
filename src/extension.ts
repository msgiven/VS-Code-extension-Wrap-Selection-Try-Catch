import * as vscode from 'vscode';

/*
Оборачивает выделенный фрагмент кода в конструкцию try-catch с автоматической корректировкой отступов.

Параметры:
   editor (vscode.TextEditor): активный текстовый редактор, в котором находится выделение.

 Возвращаемое значение:
   Promise<void>: асинхронная операция, не возвращающая явного значения, но изменяющая документ.
*/
async function WrapSelectionInTryCatch(editor: vscode.TextEditor): Promise<void> {
	const selection = editor.selection;
	const selectedText = editor.document.getText(selection);

	if (!selectedText || selectedText.trim().length === 0) {
		vscode.window.showErrorMessage('No selected text');
		return;
	}

	const document = editor.document;
	const startLine = document.lineAt(selection.start);
	const indentMatch = startLine.text.match(/^(\s*)/);
	const baseIndent = indentMatch ? indentMatch[1] : '';

	const lines = selectedText.split('\n');

	let minIndent = Number.MAX_SAFE_INTEGER;
	const nonEmptyLines = lines.filter(line => line.trim().length > 0);
	nonEmptyLines.forEach(line => {
		const indentMatch = line.match(/^(\s*)/);
		if (indentMatch) {
			minIndent = Math.min(minIndent, indentMatch[1].length);
		}
	});

	const normalizedLines = lines.map(line => {
		if (line.trim().length === 0) {
			return line;
		}
		const indentMatch = line.match(/^(\s*)/);
		if (indentMatch && indentMatch[1].length >= minIndent) {
			return line.substring(minIndent);
		}
		return line;
	});

	const indentedLines = normalizedLines.map(line => {
		if (line.trim().length === 0) {
			return line;
		}
		return baseIndent + '\t' + line; 
	});

const wrappedCode = 
    baseIndent + 'try {\n' +
    indentedLines.join('\n') + '\n' +
    baseIndent + '} catch(const std::exception& e) {\n' +
    baseIndent + '\tstd::cerr << "Error: " << e.what() << \'\\n\';\n' +
    baseIndent + '}';
	
	const success = await editor.edit(editBuilder => {
		editBuilder.replace(selection, wrappedCode);
	});

	if (!success) {
		vscode.window.showErrorMessage('Wrapping failed');
	}
}

export function activate(context: vscode.ExtensionContext) {
	const command = vscode.commands.registerCommand('wrapSelection.tryCatch', async () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}

		await WrapSelectionInTryCatch(editor);
	});

	context.subscriptions.push(command);
}

export function deactivate() {}