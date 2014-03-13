var Disassembler = Disassembler || {};

(function() {
  'use strict';

  // Pad the number 'n' to with padding character 'z' to width 'width'.
  function pad(n, width, z, tail) {
    z = z || '0';
    n = n + '';
    // Pop out any html tags when calculating length
    var length = n.replace(/<\/?[a-zA-Z ="]+>/g, '').length;

    return length >= width ? n : tail ?
      n + new Array(width - length + 1).join(z) :
      new Array(width - length + 1).join(z) + n;
  }

  // An instruction
  var Instruction = function(instruction, address, comment) {

    if (instruction.length != 8 || !instruction.match(/[0-9a-fA-F]{8}/)) {
      throw "Invalid instruction '" + instruction + "'";
    }

    var bytes = function(number) {
      var p = [];

      for (var i = Math.floor(number.length / 2); i-->0;)
        p[i] = number.slice(i * 2, (i + 1) * 2);

      return p;
    }(instruction);

    this.binary = instruction;
    this.address = address;
    this.addressHex = pad(address.toString(16), 8).toUpperCase();
    this.next = [this.address + 1];


    var address = bytes[1] + bytes[2] + bytes[3];
    var jumpAddress = parseInt(address, 16) - idtLength;
    var regA = 'r' + parseInt(bytes[1], 16);
    var regB = 'r' + parseInt(bytes[2], 16);
    var regC = 'r' + parseInt(bytes[3], 16);
    var value = bytes[2] + bytes[3];
    var paddedAddress = '00' + value;

    switch (parseInt(bytes[0], 16)) {
    case 0:
      this.mnemonic = 'nop';
      this.desc = 'No operation';
      break;
    case 1:
      this.mnemonic = 'huc';
      this.desc = 'Terminate';
      break;
    case 2:
      this.mnemonic = 'buc';
      this.desc = 'Jump to ' + address;
      this.next = [jumpAddress];
      break;
    case 3:
      this.mnemonic = 'bic';
      this.desc = 'Jump to ' + address + ' if condition flag is set';
      this.next.push(jumpAddress);
      break;
    case 4:
      this.mnemonic = 'seto   0x' + bytes[1] + ', 0x' +
        bytes[2] + ', 0x' + bytes[3];
      this.desc = 'Set outputs ' + bytes[1] + ' AND ' + bytes[2] + ' XOR ' + bytes[3];
      break;
    case 5:
      this.mnemonic = 'tsti   0x' + bytes[1] + ', 0x' +
        bytes[2] + ', 0x' + bytes[3];
      this.desc = 'Test input port ' + parseInt(bytes[1], 16) + ' AND ' +
        bytes[2] + ' XOR ' + bytes[3];
      break;
    case 6:
      this.mnemonic = 'bsr';
      this.desc = 'Call subroutine ' + address;
      this.next = [jumpAddress];
      break;
    case 7:
      this.mnemonic = 'rsr';
      this.desc = 'Return from subroutine';
      break;
    case 8:
      this.mnemonic = 'rir';
      this.desc = 'Return from interrupt';
      break;
    case 9:
      this.mnemonic = 'sei';
      this.desc = 'Enable interrupts';
      break;
    case 10:
      this.mnemonic = 'cli';
      this.desc = 'Disable interrupts';
      break;
    case 11:
      this.mnemonic = 'mtr ' + regA + ' 0x' + paddedAddress;
      this.desc = 'Load address ' + paddedAddress + ' to register ' + regA;
      break;
    case 12:
      this.mnemonic = 'rtm ' + regA + ' 0x' + paddedAddress;
      this.desc = 'Store register ' + regA + ' at address ' + paddedAddress;
      break;
    case 13:
      this.mnemonic = 'imtr ' + regA + ', ' + regB + ', ' + regC;
      this.desc = 'Load address ' + regB + ' + ' + regC + ' to register ' + regA;
      break
    case 14:
      this.mnemonic = 'rtim ' + regA + ', ' + regB + '(' + regC + ')';
      this.desc = 'Store register ' + regA + ' at address ' + regB + ' + ' + regC;
      break;
    case 15:
      this.mnemonic = 'pshr ' + regA;
      this.desc = 'Push register ' + regA + ' to stack';
      break;
    case 16:
      this.mnemonic = 'popr ' + regA;
      this.desc = 'Pop register ' + regA + ' from stack';
      break;
    case 17:
      this.mnemonic = 'rtio 0x' + bytes[1] + ', ' + regA;
      this.desc = 'Register ' + regA + ' to IO port 0x' + bytes[1];
      break;
    case 18:
      this.mnemonic = 'iotr ' + regA + ', 0x' + bytes[2];
      this.desc = 'IO port 0x' + bytes[1] + ' to register ' + regA;
      break;
    case 19:
      this.mnemonic = 'ldlr ' + regA + ', 0x' + value;
      this.desc = 'Load immediate 0x' + value + ' to lower ' + regA;
      break;
    case 20:
      this.mnemonic = 'ldur ' + regA + ', 0x' + value;
      this.desc = 'Load immediate 0x' + value + ' to upper ' + regA;
      break;
    case 21:
      this.mnemonic = 'andr ' + regA + ', ' + regB + ', ' + regC;
      this.desc = 'Set ' + regA + ' to ' + regB + ' & ' + regC;
      break;
    case 22:
      this.mnemonic = 'orr ' + regA + ', ' + regB + ', ' + regC;
      this.desc = 'Set ' + regA + ' to ' + regB + ' | ' + regC;
      break;
    case 23:
      this.mnemonic = 'xorr ' + regA + ', ' + regB + ', ' + regC;
      this.desc = 'Set ' + regA + ' to ' + regB + ' ^ ' + regC;
      break;
    case 24:
      this.mnemonic = 'srlr ' + regA + ', ' + regB + ', ' + regC;
      this.desc = 'Set ' + regA + ' to ' + regB + ' >> ' + regC;
      break;
    case 25:
      this.mnemonic = 'sllr ' + regA + ', ' + regB + ', ' + regC;
      this.desc = 'Set ' + regA + ' to ' + regB + ' << ' + regC;
      break;
    default:
      throw "Invalid opcode '" + bytes[0] + "'";
    };

    if (comment !== undefined)
      this.comment = comment;
    else if (this.desc !== undefined)
      this.comment = this.desc;
    else
      this.comment = '';

    this.getLabel = function(type) {
      if (this.label === undefined) {
        if (type == 'routine')
          this.label = new RoutineLabel();
        else if (type == 'interrupt')
          this.label = new VectorLabel();
        else
          this.label = new Label();
      }

      return this.label;
    };

    this.toString = function(instructions) {
      var label = this.label ? this.getLabel().toString() + '\n' : '';
      var string = '        ';

      if (this.next[0] !== this.address + 1) {
        string += '<span class="mnemonic">' + this.mnemonic +
          '</span>' + '\t';

        if (this.address < idtLength) // Interrupt vector
          string += instructions[this.next[0]].getLabel('interrupt').name;
        else if (this.mnemonic == 'bsr')
          string += instructions[this.next[0]].getLabel('routine').name;
        else // Jump instruction
          string += instructions[this.next[0]].getLabel().name;

      } else if (this.next[1] !== undefined) { // Branch instruction
        string += '<span class="mnemonic">' + this.mnemonic + '</span>' +
          '\t' + instructions[this.next[1]].getLabel().name;
      } else {
        var components = this.mnemonic.replace(/,/g, '').replace(/ +/g, ' ').split(' ');

        string += '<span class="mnemonic">' + components[0] +
          '</span>\t<span class="value">' +
          components.slice(1).join('</span>, <span class="value">')
          + '</span>';
      }

      return label + string;
    };
  };

  var Directive = function(name) {
    this.comment = '';
    this.toString = function() {
      return '<span class="directive">.' + name + '</span>';
    };
  };

  var Comment = function(text) {
    this.comment = '';
    this.toString = function() {
      return '<span class="comment">;; ' + text + '</span>';
    };
  };

  var BlankLine = function() {
    this.comment = '';
    this.toString = function() {
      return ' ';
    };
  };

  var _labelCounter = 0; // Used for automatic label naming
  var _routineCounter = 0; // Used for automatic interrupt label naming
  var _vectorCounter = 0; // Used for automatic interrupt label naming

  var Label = function(name) {
    this.name = name ? name : 'label' + _labelCounter++;

    this.toString = function() {
      return '<span class="asm-label">' + this.name + '</span>:';
    };
  };

  var RoutineLabel = function(name) {
    this.name = name ? name : 'subroutine' + _routineCounter++;

    this.toString = function() {
      return ' \n<span class="asm-label">' + this.name + '</span>:';
    };
  };

  var VectorLabel = function(name) {
    this.name = name ? name : 'irq' + _vectorCounter++;

    this.toString = function() {
      return ' \n<span class="asm-label">' + this.name + '</span>:';
    };
  };

  var $code = $('#code');
  var $errors = $('#errors');
  var $output = $('#output');

  var idtLength = 8; // Interrupt Descriptor Table length (in words)

  // Decode an array of strings, one instruction per string
  var decode = function(text) {

    var instructions = [], idt = [], address = 0, string = '', i = 0;

    try { // Parse instructions
      for (i = 0; i < text.length; i++) {
        string = text[i].trim();

        if (string.length) {
          if (i < idtLength) { // Interrupt descriptor
            idt.push(new Instruction(string, address++,
                                     'Interrupt vector ' + i));
          } else { // Instruction
            instructions.push(new Instruction(string, address++));
          }
        }
      }
    } catch (err) { // Stop decoding on first error
      addError("<strong>At line " + i + ":</strong> " + err);
    }

    return {
      instructions: instructions,
      idt: idt
    };
  }

  var showAssembly = function(data) {
    var instructions = data.instructions;
    var idt = data.idt;
    var prog = [new Comment('Generated assembly, see:'),
                new Comment('    http://chriscummins.cc/disassembler'),
                new Comment(''),
                new BlankLine()];
    var string = '';

    prog.push(new Directive('cseg'));
    prog.push(new Directive('org 0x0000'));

    if (idt.length) { // Show interrupt table label
      prog.push(new BlankLine());

      idt[0].label = new Label('interrupt_vectors');
      idt.forEach(function(e) {
        prog.push(e);
      });

      prog.push(new BlankLine());
      prog.push(new Directive('org 0x0008'));
    }

    prog.push(new BlankLine());

    if (instructions.length) // Set special "start" label
      instructions[0].label = new Label('_main');

    instructions.forEach(function(e) {
      prog.push(e);
    });

    // Generate label cross references
    prog.forEach(function(e) {
      try {
        e.toString(instructions);
      } catch (err) {
        addError("<strong>At address " + e.addressHex +
                 ":</strong> Branch address out of bounds!")
      }
    });

    prog.push(new BlankLine());
    prog.push(new Comment('End of program code'))

    // Display table
    prog.forEach(function(e) {
      try {
        addInstruction(e, instructions);
      } catch (e) {}
    });
  };

  // Display an array of instructions
  var show = function(data) {

    var instructions = data.instructions;
    var idt = data.idt;

    showAssembly(data);

    if (idt.length || instructions.length)
      $('#code-output').show();
    else
      $('#code-output').hide();
  };

  var addError = function(msg) {
    $errors.append("<div class=\"alert alert-error\">" + msg +
                   "<a class=\"close\" data-dismiss=\"alert\" " +
                   "href=\"#\">&times;</a></div>");
  };

  var addWarning = function(msg) {
    $errors.append("<div class=\"alert alert-warning\">" + msg +
                   "<a class=\"close\" data-dismiss=\"alert\" " +
                   "href=\"#\">&times;</a></div>");
  };

  var addInstruction = function(instruction, instructions) {

    var addRow = function(address, comment, instruction, caption, id, target) {
      var html = '<tr';

      if (caption && caption !== '')
        html += ' title="' + caption + '"';

      if (id && id !== '')
        html += ' id="' + id + '"';

      if (target && target !== '')
        html += ' data-target="' + target + '"';

      html += '><td class="address"><pre>';

      if (address && address !== '')
        html += address;

      html += '</pre></td><td class="instruction"><pre>' +
        instruction + '</pre></td><td class="comment">';

      if (comment)
        html += '<pre><span class="comment">; ' + comment + '</span></pre>';

      html += '</td></tr>';

      $output.append(html);
    };

    var addInstructionRow = function(address, text, caption,
                                     instruction, instructions) {
      if (!instruction.next) // Non-instructions: comments, directives etc.
        addRow(address,  instruction.comment, text, caption);
      if (instruction.next[0] !== instruction.address + 1) // Jump instructions
        addRow(address, instruction.comment, text, caption, '',
               instructions[instruction.next[0]].addressHex);
      else if (Number(instruction.next[1])) // Branch instructions
        addRow(address, instruction.comment, text, caption, '',
               instructions[instruction.next[1]].addressHex);
      else // Standard instruction
        addRow(address, instruction.comment, text, caption);
    };

    var address = instruction.address === undefined ?
      '' : instruction.addressHex;
    var caption = instruction.desc === undefined ? '' : instruction.desc;
    var lines = instruction.toString(instructions).split('\n');

    if (lines.length > 1) { // Instruction contains label
      for (var i = 0; i < lines.length - 2; i++)
        addRow('', '', lines[i]);
      addRow('', instruction.comment, lines[lines.length - 2], '', instruction.addressHex);
      addInstructionRow(address, lines[lines.length - 1], caption, instruction, instructions);
    } else {
      addInstructionRow(address, lines[0], caption, instruction, instructions);
    }
  };

  var refresh = function() { // Refresh display
    $errors.html('');
    $output.html('');
    _labelCounter = 0;
    _routineCounter = 0;
    _vectorCounter = 0;

    show(decode($code.val().split("\n")));

    $('#output tr').click(function() {
      var target = $(this).attr('data-target');

      if (target) {
        $('tr').removeClass('highlight');
        $('#' + target).addClass('highlight');
        window.location.hash = target;
      }
    });
  };

  // Update as the user types
  $code.bind('input propertychange', function() {
    refresh();
  });

  $('#idt-enable').change(function() {
    idtLength = parseInt($('#idt-enable option:selected').val());
    refresh();
  });

}).call(Disassembler);
