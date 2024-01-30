/**
 * @typedef {Object} DecodedUplink
 * @property {Object} data - The open JavaScript object representing the decoded uplink payload when no errors occurred
 * @property {string[]} errors - A list of error messages while decoding the uplink payload
 * @property {string[]} warnings - A list of warning messages that do not prevent the driver from decoding the uplink payload
 */

/**
 * Decode uplink
 * @param {Object} input - An object provided by the IoT Flow framework
 * @param {number[]} input.bytes - Array of bytes represented as numbers as it has been sent from the device
 * @param {number} input.fPort - The Port Field on which the uplink has been sent
 * @param {Date} input.recvTime - The uplink message time recorded by the LoRaWAN network server
 * @returns {DecodedUplink} The decoded object
 */
function decodeUplink(input) {
    let result = {
        data: {},
        errors: [],
        warnings: []
    };
    const raw = Buffer.from(input.bytes);

    if (raw.byteLength > 30) { // 30 is the max number of bytes in a payload
        result.errors.push("Invalid uplink payload: length exceeds 30 bytes");
        delete result.data;
        return result;
    }

    switch (raw[0]) {
        case 0x11:
            result.data.frame_type = "Status frame";
            if (raw.byteLength < 13 ) {
                result.errors.push("Invalid uplink payload: index out of bounds when reading status frame");
                delete result.data;
                return result;
            } else {
                let i = 1;
                result.data.device_id = '00'+raw[i].toString(16)+raw[i+1].toString(16)+raw[i+2].toString(16)+raw[i+3].toString(16);
                i += 4;
                result.data.port = raw[i];
                i += 1;
                result.data.device_date_time = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                i += 4;
                result.data.firmware = raw[i].toString(16)+'.'+raw[i+1].toString(16)+'.'+raw[i+2].toString(16);
                i += 3;
                let name = raw[i].toString(16);
                for (j = i+1; j < raw.byteLength; j ++) {
                    name = name+raw[j].toString(16);
                }
                result.data.name = name;
                return result;
            }
        case 0x01:
            result.data.frame_type = "Data frame";
            if (raw.byteLength < 14 ) {
                result.errors.push("Invalid uplink payload: index out of bounds when reading data frame");
                delete result.data;
                return result;
            } else {
                let i = 1;
                result.data.tcp_ip = `${raw[i]}.${raw[i + 1]}.${raw[i + 2]}.${raw[i + 3]}`;
                i += 4;
                result.data.tcp_port = raw[i]*256 + raw[i+1];
                i += 2;
                result.data.slave_id = raw[i];
                i += 1;
                result.data.modbus = raw[i];
                i += 1;
                result.data.start_value = raw[i]*256 + raw[i+1];
                i += 2;
                result.data.registers_quiered = raw[i]*256 + raw[i+1];
                i += 2;
                result.data.data_bytes = raw[i];
                i += 1;
                switch (raw[7]) {
                    case 0x0a:
                        result.data.c1 = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        result.data.frame_type = "Data frame - GAS METER";
                        return result;
                    case 0x0b:
                        result.data.c1 = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.c2 = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        result.data.frame_type = "Data frame - WATER METER";
                        return result;
                    case 0x0c:
                        result.data.ea = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.er = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        result.data.frame_type = "Data frame - ENERGY METER";
                        return result;
                    case 0xf7:
                        result.data.ea_imp = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.er_ind_imp = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.er_cap_imp = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.es_imp = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        result.data.frame_type = "Data frame - IMPORTED ENERGY";
                        return result;
                    default:
                    result.errors.push("Invalid uplink payload: unknown data frame type");
                    delete result.data;
                    return result;
                }
            }
        default:
            result.errors.push("Invalid uplink payload: unknown frame type");
            return result;
    }
}

exports.decodeUplink = decodeUplink;