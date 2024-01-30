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
    const rawHEX = Buffer.from(input.bytes.toString(16)); //we need to keep an hexa value for some names

    if (raw.byteLength > 30) { // 30 is the max number of bytes in a payload
        result.errors.push("Invalid uplink payload: length exceeds 30 bytes");
        delete result.data;
        return result;
    }

    switch (rawHEX[0]) {
        case 0x11:
            result.data.frame_type = "Status frame";
            if (rawHEX.byteLength < 28 ) {
                result.errors.push("Invalid uplink payload: index out of bounds when reading Device ID");
                delete result.data;
                return result;
            } else {
                let i = 1;
                result.data.device_id = `${rawHEX[i]}${rawHEX[i + 1]}${rawHEX[i + 2]}${rawHEX[i + 3]}`;
                i += 4;
                result.data.port = `${rawHEX[i]}`;
                i += 1;
                result.data.device_date_time = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                i += 4;
                result.data.firmware = `${rawHEX[i]}${rawHEX[i + 1]}${rawHEX[i + 2]}`;
                i += 3;
                for (j = i; j < rawHEX.byteLength; j ++) {
                    result.data.name = `${result.data.name}${rawHEX[j]}`;
                }
                return result;
            }
        case 0x01:
            result.data.frame_type = "Data frame";
            if (rawHEX.byteLength < 14 ) {
                result.errors.push("Invalid uplink payload: index out of bounds when reading Fram parameters");
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
                switch (rawHEX[7]) {
                    case 0x0a:
                        result.data.c1 = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        return result;
                    case 0x0b:
                        result.data.c1 = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.c2 = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        return result;
                    case 0x0c:
                        result.data.ea = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.er = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        return result;
                    case 0xf7:
                        result.data.ea_imp = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.er_ind_imp = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.er_cap_imp = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        i += 4;
                        result.data.es_imp = raw[i]*256**3 + raw[i + 1]*256**2 + raw[i + 2]*256 + raw[i + 3];
                        return result;
                    default:
                    result.errors.push("Invalid uplink payload: unknown id '" + raw[i] + "'");
                    delete result.data;
                    return result;
                }
            }
        default:
            result.errors.push("Invalid uplink payload: unknown id '" + raw[i] + "'");
            delete result.data;
            return result;
    }
}

exports.decodeUplink = decodeUplink;