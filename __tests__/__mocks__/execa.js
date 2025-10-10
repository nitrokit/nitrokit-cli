// Mock for execa package
const execa = jest.fn().mockResolvedValue({
	exitCode: 0,
	stdout: '',
	stderr: '',
});

module.exports = { execa };
