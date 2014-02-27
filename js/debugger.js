var Disassembler = Disassembler || {};

(function() {
  'use strict';

  var ExecutionUnit = function(ram) {

    this.ram = [];
    this.instruction = 0;

    this.pc = 8;
    this.sp = 0;
    this.sr = ['0','0','0','0','0','0','0','0'];
    this.intr = ['0','0','0','0','0','0','0','0'];

    this.next_pc = 8;
    this.next_sp = parseInt('ffffffff', 16);
    this.next_sr = ['0','0','0','0','0','0','0','0'];
    this.next_intr = ['0','0','0','0','0','0','0','0'];

    this.rom_en = false;
    this.rom_addr = 0;
    this.rom_data = 0;

    this.ram_wr = false;
    this.ram_waddr = 0;
    this.ram_wdata = 0;
    this.ram_rd = false;
    this.ram_raddr = 0;
    this.ram_rdata = 0;

    this.io_in = [0, 0];
    this.io_out = [0, 0];

    // Initialise RAM
    for (var i = 0; i < 1024; i++)
      this.ram[i] = i < ram.length ? ram[i] : '00000000';

    this.tick = function() {
      this.pc = this.next_pc;
      this.sp = this.next_sp;
      this.sr = this.next_sr;
      this.intr = this.next_intr;

      this.instruction = this.ram[this.pc];

      var opcode = this.instruction.substring(0, 2);
      var load = parseInt(this.instruction.substring(2), 16);
      var stack = this.ram[this.sp];

      switch (opcode) {
      case "01": // HUC
        break;
      case "02": // BUC
        this.next_pc = load;
        break;
      case "06": // BSR
        this.ram_wr = true;
        this.ram_waddr = this.sp;
        this.ram_wdata = this.pc + 1;
        this.next_ram_raddr = this.sp;
        this.next_sp = this.sp - 1;
        this.next_pc = load;
      case "07": // RSR
        this.next_ram_raddr = 0;
        this.next_sp = this.sp + 1;
        this.next_pc = stack;
      case "00": // IUC
      default:
        this.next_pc = this.pc + 1;
        break;
      };
    };

  };

  var testRAM = [
    '02000036',
    '08000000',
    '08000000',
    '08000000',
    '08000000',
    '08000000',
    '08000000',
    '08000000',
    '0A000000',
    '04000008',
    '06000033',
    '0500F050',
    '0300000E',
    '02000022',
    '0400FF80',
    '06000031',
    '0500F010',
    '03000013',
    '02000024',
    '0400FF40',
    '06000031',
    '0500F080',
    '03000018',
    '02000026',
    '0400FF20',
    '06000031',
    '0500F090',
    '0300001D',
    '02000028',
    '0400FF10',
    '05012020',
    '0300001E',
    '0400FF01',
    '0200002C',
    '0400FF80',
    '06000031',
    '0400FF40',
    '06000031',
    '0400FF20',
    '06000031',
    '0400FF10',
    '05012020',
    '03000029',
    '0400FF02',
    '05014000',
    '0300002C',
    '05014040',
    '0300002E',
    '02000008',
    '05012020',
    '03000031',
    '05012000',
    '03000033',
    '07000000',
    '0400FF0C',
    '08000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000'];

  var eu = new ExecutionUnit(testRAM);

  var $regFile = $('.register-file > table');
  var $mem = $('.memory > table');

  // Pad the number 'n' to with padding character 'z' to width 'width'.
  var pad = function(n, width, z, tail) {
    z = z || '0';
    n = n + '';
    // Pop out any html tags when calculating length
    var length = n.replace(/<\/?[a-zA-Z ="]+>/g, '').length;

    return length >= width ? n : tail ?
      n + new Array(width - length + 1).join(z) :
      new Array(width - length + 1).join(z) + n;
  }

  var numToRegText = function(number) {
    var binString = pad(number.toString(2), 32);

    return binString.substring(0, 8) + ' ' + binString.substring(8, 16) +
      ' ' + binString.substring(16, 24) + ' ' + binString.substring(24, 32);
  }

  var setRegister = function(id, value) {
    $(' td.r-value', getRegister(id)).text(numToRegText(value));
  };

  var getRegister = function(id) {
    return $(' tr[data-r="' + id + '"]', $regFile);
  };

  var setMemory = function(address, value) {
    $(' td.r-value', getMemory(address)).text(numToRegText(value));
  };

  //
  var getMemory = function(address) {
    return $(' tr[data-r="' + address + '"]', $mem);
  };

  var getNewTableRow = function(id, value, label) {
    value = value || 0;
    label = label || id;
    return '<tr data-r="' + id + '"><td class="r-label">' + label + '</td>' +
      '<td class="r-value">' + numToRegText(value) + '</td>';
  };

  var setCurrentAddress = function(address) {
    $(' tr', $mem).removeClass('highlight');
    getMemory(address).addClass('highlight');
  };

  for (var i = 0; i < 256; i++)
    $regFile.append(getNewTableRow('r' + i));

  for (var i = 0; i < 1024; i++)
    $mem.append(getNewTableRow(i, 0, pad(i.toString(16).toUpperCase(), 8)));

  var updateView = function() {
    for (var i in eu.ram) // Write test memory
      setMemory(i, eu.ram[i]);

    setCurrentAddress(eu.pc);
    setRegister('il', parseInt(eu.intr.join(), 2));
    setRegister('pc', eu.pc);
    setRegister('sr', parseInt(eu.sr.join(), 2));
    setRegister('sp', eu.sp);
  }

  updateView();

  var $step = $('.debug-controls .control-step');
  var $start = $('.debug-controls .control-start');
  var $stop = $('.debug-controls .control-stop');
  var active;

  var tick = function() {
    eu.tick();
    updateView();
    stop();
  };

  var start = function() {
    tick();
    active = setTimeout(start, 750);

    $stop.removeClass('disabled');
    $start.addClass('disabled');
  };

  var stop = function() {
    if (active)
      clearTimeout(active);

    $start.removeClass('disabled');
    $stop.addClass('disabled');
  };

  $step.click(tick);
  $start.click(start);
  $stop.click(stop);

}).call(Disassembler);
